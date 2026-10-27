"""Estagiário de edição: recorta o fundo das fotos das ofertas.

Roda nas máquinas do GitHub (ver .github/workflows/recorte.yml), em horário definido.
Regras (combinadas com o Moreno):
  - o recorte é SÓ para os destaques do topo (Achado da vez + 2 secundários): recorta as fotos
    dos destaques atuais (escolhidos automaticamente, ou marcados à mão se o destaque automático
    estiver desligado) e as fotos que você pedir no painel ("Pedir recorte");
  - no máximo LIMITE imagens por execução (padrão 5);
  - se a automação "recorte" estiver pausada no painel, não faz nada;
  - com "aprovação automática" ligada no painel, o recorte pronto já vai para o site
    (você pode voltar para a foto original na ficha); desligada, espera você aprovar;
  - erros ficam anotados na ficha e no Diário, e a ficha não é tocada de novo até você pedir.
"""

from __future__ import annotations

import io
import os
import sys
import time

import numpy as np
from PIL import Image
from scipy import ndimage

LIMITE = int(os.environ.get("LIMITE", "5"))
TAMANHO_MAX = 900  # lado maior do PNG final, em px
# Até 3 versões por foto (fundo branco, BiRefNet, ISNet); cada uma tem limite de tempo próprio.
HOSTS_PERMITIDOS = ("mlstatic.com",)  # fotos do Mercado Livre


def limpar_mascara(alfa: np.ndarray) -> np.ndarray:
    """Remove "farelos": pedaços soltos pequenos (< 10% da maior parte) que o recorte deixou."""
    solido = alfa > 20
    rotulos, n = ndimage.label(solido)
    if n <= 1:
        return alfa
    tamanhos = ndimage.sum(solido, rotulos, range(1, n + 1))
    manter = np.isin(rotulos, [i + 1 for i, t in enumerate(tamanhos) if t >= 0.10 * tamanhos.max()])
    return np.where(manter, alfa, 0).astype(np.uint8)


# Ordem de preferência: o primeiro que der certo vai para o site (você pode trocar na ficha)
METODOS = ("fundo_branco", "birefnet", "isnet")
MODELOS = {"birefnet": "birefnet-general", "isnet": "isnet-general-use"}


def fundo_branco(img: Image.Image, tolerancia: int = 18) -> Image.Image | None:
    """Para fotos com fundo branco liso (o comum no Mercado Livre): tira só o branco que ENCOSTA
    na borda da foto. O branco de DENTRO do produto (embalagem, janela, etiqueta) fica."""
    from PIL import ImageFilter

    a = np.asarray(img.convert("RGB")).astype(np.int16)
    quase_branco = (a.min(axis=2) >= 255 - tolerancia) & ((a.max(axis=2) - a.min(axis=2)) <= 12)
    borda = np.concatenate([quase_branco[0], quase_branco[-1], quase_branco[:, 0], quase_branco[:, -1]])
    if borda.mean() < 0.9:
        return None  # a foto não tem fundo branco liso: este método não serve
    rotulos, _ = ndimage.label(quase_branco)
    ids_borda = np.unique(np.concatenate([rotulos[0], rotulos[-1], rotulos[:, 0], rotulos[:, -1]]))
    fundo = np.isin(rotulos, ids_borda[ids_borda > 0])
    alfa = Image.fromarray(np.where(fundo, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    saida = img.convert("RGBA")
    saida.putalpha(alfa)
    return saida


def recortar(original: bytes, sessao=None, metodo: str = "isnet") -> tuple[bytes, int, int]:
    """Foto → PNG transparente, cortado justo no produto (com uma folguinha) e reduzido."""
    img = Image.open(io.BytesIO(original)).convert("RGB")
    if metodo == "fundo_branco":
        saida = fundo_branco(img)
        if saida is None:
            raise ValueError("a foto não tem fundo branco liso")
    else:
        from rembg import remove

        saida = remove(img, session=sessao, post_process_mask=True)
    rgba = np.array(saida)
    rgba[..., 3] = limpar_mascara(rgba[..., 3])
    saida = Image.fromarray(rgba, "RGBA")
    caixa = saida.getchannel("A").point(lambda a: 255 if a > 20 else 0).getbbox()
    if not caixa:
        raise ValueError("o recorte ficou vazio (não achou um produto na foto)")
    saida = saida.crop(caixa)
    area = (caixa[2] - caixa[0]) * (caixa[3] - caixa[1])
    if area < 0.04 * img.width * img.height:
        raise ValueError("o recorte ficou pequeno demais (menos de 4% da foto)")
    folga = max(8, int(max(saida.size) * 0.03))
    final = Image.new("RGBA", (saida.width + 2 * folga, saida.height + 2 * folga), (0, 0, 0, 0))
    final.paste(saida, (folga, folga))
    final.thumbnail((TAMANHO_MAX, TAMANHO_MAX))
    buf = io.BytesIO()
    final.save(buf, "PNG", optimize=True)
    return buf.getvalue(), final.width, final.height


def recortar_em_processo_separado(original: bytes, metodo: str, limite_s: int = 180) -> tuple[bytes, int, int]:
    """Modelos pesados rodam num processo à parte: se faltar memória ou tempo, só esta versão falha."""
    import pickle
    import subprocess

    r = subprocess.run(
        [sys.executable, __file__, "--um", metodo],
        input=original, capture_output=True, timeout=limite_s,
    )
    if r.returncode != 0:
        raise RuntimeError(f"{metodo} falhou (código {r.returncode}): {r.stderr.decode(errors='ignore')[-200:]}")
    return pickle.loads(r.stdout)


def baixar(url: str) -> bytes:
    import requests
    from urllib.parse import urlparse

    host = (urlparse(url).hostname or "").lower()
    if urlparse(url).scheme != "https" or not any(host == h or host.endswith("." + h) for h in HOSTS_PERMITIDOS):
        raise ValueError(f"foto fora do Mercado Livre ({host}); recorte só para fotos mlstatic.com")
    r = requests.get(url, timeout=20, headers={"User-Agent": "MaisUmSet-recorte/1.0"})
    r.raise_for_status()
    if len(r.content) > 8_000_000:
        raise ValueError("foto grande demais (> 8 MB)")
    return r.content


def main() -> int:
    import psycopg

    url_banco = os.environ.get("DATABASE_URL")
    if not url_banco:
        print("Falta o segredo DATABASE_URL no GitHub. Nada feito.")
        return 1

    with psycopg.connect(url_banco, connect_timeout=15) as con:
        ativa = con.execute("SELECT ativa FROM automacoes WHERE nome = 'recorte'").fetchone()
        if not ativa or not ativa[0]:
            print("Automação 'recorte' está pausada no painel. Nada feito.")
            con.execute("UPDATE automacoes SET ultima_execucao = now(), ultimo_resultado = 'pausada' WHERE nome = 'recorte'")
            return 0

        auto = con.execute("SELECT ativa FROM automacoes WHERE nome = 'destaque_automatico'").fetchone()
        automatico = bool(auto and auto[0])
        # Os 3 destaques atuais (achado + 2 secundários), pela MESMA regra do site (src/lib/destaques.ts e src/lib/vitrine.ts):
        # publicada, completa, preço verificado < 36 h; automático = maior desconto confirmado (1–90%).
        achado_sql = (
            """SELECT f.id FROM fichas f
                WHERE f.estado = 'publicada' AND f.link_afiliado IS NOT NULL AND f.imagem IS NOT NULL
                  AND f.categoria IS NOT NULL AND f.preco_atual IS NOT NULL
                  AND f.verificado_em > now() - interval '36 hours'
                ORDER BY CASE WHEN f.preco_anterior > f.preco_atual
                               AND round((1 - f.preco_atual / f.preco_anterior) * 100) BETWEEN 1 AND 90
                              THEN round((1 - f.preco_atual / f.preco_anterior) * 100) ELSE -1 END DESC,
                         f.verificado_em DESC
                LIMIT 3"""
            if automatico
            else """SELECT id FROM fichas WHERE estado = 'publicada' AND destaque IN ('achado_da_vez', 'secundario')
                     ORDER BY destaque = 'achado_da_vez' DESC, publicado_em DESC LIMIT 3"""
        )
        fila = con.execute(
            f"""WITH achado AS ({achado_sql})
                SELECT f.id, f.imagem FROM fichas f LEFT JOIN recortes r ON r.ficha_id = f.id
                 WHERE f.imagem IS NOT NULL AND (
                       f.recorte_status = 'pendente'                                   -- pedido no painel
                    OR (f.id IN (SELECT id FROM achado)                                -- destaques atuais
                        AND (f.recorte_status IS NULL
                             OR (f.recorte_status = 'pronto' AND r.imagem_origem IS DISTINCT FROM f.imagem))))
                 ORDER BY f.atualizado_em DESC LIMIT %s""",
            (LIMITE,),
        ).fetchall()
        print(f"{len(fila)} foto(s) para recortar (limite {LIMITE}).")
        if not fila:
            con.execute("UPDATE automacoes SET ultima_execucao = now(), ultimo_resultado = 'nada a fazer' WHERE nome = 'recorte'")
            return 0

        aprova = con.execute("SELECT ativa FROM automacoes WHERE nome = 'recorte_aprovacao_automatica'").fetchone()
        aprovar_sozinho = bool(aprova and aprova[0])

        ok = erros = 0
        for ficha_id, imagem in fila:
            inicio = time.time()
            try:
                original = baixar(imagem)
                versoes: dict[str, tuple[bytes, int, int]] = {}
                falhas: list[str] = []
                for metodo in METODOS:
                    try:
                        if metodo == "fundo_branco":
                            versoes[metodo] = recortar(original, metodo=metodo)
                        else:
                            versoes[metodo] = recortar_em_processo_separado(original, metodo)
                    except Exception as e:  # noqa: BLE001 — cada versão é independente
                        falhas.append(f"{metodo}: {str(e)[:120]}")
                if not versoes:
                    raise ValueError("nenhum método conseguiu recortar (" + "; ".join(falhas) + ")")
                escolhido = next(m for m in METODOS if m in versoes)
                png, w, h = versoes[escolhido]
                with con.transaction():
                    con.execute("DELETE FROM recorte_opcoes WHERE ficha_id = %s", (ficha_id,))
                    for metodo, (png_m, _, _) in versoes.items():
                        con.execute(
                            "INSERT INTO recorte_opcoes (ficha_id, metodo, png) VALUES (%s, %s, %s)",
                            (ficha_id, metodo, png_m),
                        )
                    con.execute(
                        """INSERT INTO recortes (ficha_id, png, imagem_origem, largura, altura, metodo) VALUES (%s, %s, %s, %s, %s, %s)
                           ON CONFLICT (ficha_id) DO UPDATE SET png = EXCLUDED.png, imagem_origem = EXCLUDED.imagem_origem,
                             largura = EXCLUDED.largura, altura = EXCLUDED.altura, metodo = EXCLUDED.metodo, criado_em = now()""",
                        (ficha_id, png, imagem, w, h, escolhido),
                    )
                    con.execute(
                        "UPDATE fichas SET recorte_status = 'pronto', recorte_erro = NULL, usar_recorte = %s WHERE id = %s",
                        (aprovar_sozinho, ficha_id),
                    )
                    con.execute(
                        "INSERT INTO verificacoes (ficha_id, autor, resultado, mudancas) VALUES (%s, 'automacao', 'ok', %s)",
                        (
                            ficha_id,
                            [
                                f"recorte pronto ({len(versoes)} versões; em uso: {escolhido})"
                                + (" e já no site (aprovação automática)" if aprovar_sozinho else ": aguardando sua aprovação")
                            ],
                        ),
                    )
                ok += 1
                print(f"  ✓ {ficha_id} ({', '.join(versoes)}; em uso: {escolhido}; {time.time() - inicio:.1f} s)")
                for f in falhas:
                    print(f"    · {f}")
            except Exception as e:  # noqa: BLE001 — cada foto é independente
                msg = str(e)[:300]
                with con.transaction():
                    con.execute("UPDATE fichas SET recorte_status = 'erro', recorte_erro = %s WHERE id = %s", (msg, ficha_id))
                    con.execute(
                        "INSERT INTO verificacoes (ficha_id, autor, resultado, erro) VALUES (%s, 'automacao', 'erro', %s)",
                        (ficha_id, f"recorte: {msg}"),
                    )
                erros += 1
                print(f"  ✗ {ficha_id}: {msg}")

        con.execute(
            "UPDATE automacoes SET ultima_execucao = now(), ultimo_resultado = %s WHERE nome = 'recorte'",
            (f"{ok} recortada(s), {erros} erro(s)",),
        )
    return 0


def um_metodo(metodo: str) -> int:
    """Modo processo separado: lê a foto da entrada, devolve o recorte (pickle) na saída."""
    import pickle

    saida = os.fdopen(os.dup(1), "wb")
    sys.stdout = sys.stderr  # avisos e barras de download não podem sujar a resposta
    from rembg import new_session

    original = sys.stdin.buffer.read()
    resultado = recortar(original, new_session(MODELOS[metodo]), metodo)
    saida.write(pickle.dumps(resultado))
    saida.flush()
    return 0


if __name__ == "__main__":
    if sys.argv[1:2] == ["--um"]:
        sys.exit(um_metodo(sys.argv[2]))
    sys.exit(main())
