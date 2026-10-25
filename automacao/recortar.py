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


def recortar(original: bytes, sessao) -> tuple[bytes, int, int]:
    """Foto → PNG transparente, cortado justo no produto (com uma folguinha) e reduzido."""
    from rembg import remove

    img = Image.open(io.BytesIO(original)).convert("RGB")
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

        from rembg import new_session

        sessao = new_session("isnet-general-use")
        ok = erros = 0
        for ficha_id, imagem in fila:
            inicio = time.time()
            try:
                png, w, h = recortar(baixar(imagem), sessao)
                with con.transaction():
                    con.execute(
                        """INSERT INTO recortes (ficha_id, png, imagem_origem, largura, altura) VALUES (%s, %s, %s, %s, %s)
                           ON CONFLICT (ficha_id) DO UPDATE SET png = EXCLUDED.png, imagem_origem = EXCLUDED.imagem_origem,
                             largura = EXCLUDED.largura, altura = EXCLUDED.altura, criado_em = now()""",
                        (ficha_id, png, imagem, w, h),
                    )
                    con.execute(
                        "UPDATE fichas SET recorte_status = 'pronto', recorte_erro = NULL, usar_recorte = %s WHERE id = %s",
                        (aprovar_sozinho, ficha_id),
                    )
                    con.execute(
                        "INSERT INTO verificacoes (ficha_id, autor, resultado, mudancas) VALUES (%s, 'automacao', 'ok', %s)",
                        (
                            ficha_id,
                            ["recorte da foto pronto e já em uso no site (aprovação automática)"]
                            if aprovar_sozinho
                            else ["recorte da foto pronto: aguardando sua aprovação"],
                        ),
                    )
                ok += 1
                print(f"  ✓ {ficha_id} ({w}x{h}, {time.time() - inicio:.1f} s)")
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


if __name__ == "__main__":
    sys.exit(main())
