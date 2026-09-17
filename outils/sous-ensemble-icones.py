# -*- coding: utf-8 -*-
"""
Réduit Font Awesome 6 Free aux seules icônes employées dans les pages du site,
puis réécrit la partie générée de la section 49 de la feuille de style.

Pourquoi : la version complète pèse 302 Ko de police pour 2 060 icônes ; le site
en utilise une cinquantaine. Le sous-ensemble tient dans 8 Ko.

À relancer après TOUT ajout d'une classe fa-… dans le HTML : sans cela, le
glyphe n'existe pas dans la police livrée et la place reste vide.

    pip install fonttools brotli pyyaml
    npm pack @fortawesome/fontawesome-free@6 && tar xzf fortawesome-*.tgz
    python3 outils/sous-ensemble-icones.py [chemin/vers/package]

Le dossier « package » est celui que produit npm pack ; par défaut on le cherche
à côté de ce script.
"""
import os, re, sys, glob, json, subprocess, collections

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAQUET = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "package")
FONTS  = os.path.join(RACINE, "assets", "fonts")
CSS    = os.path.join(RACINE, "assets", "css", "style.css")

FAMILLE = {"fa-solid": "solid", "fa-regular": "regular", "fa-brands": "brands"}
SOURCE  = {"solid": "fa-solid-900.woff2", "regular": "fa-regular-400.woff2", "brands": "fa-brands-400.woff2"}
SORTIE  = {"solid": "fa-solid.woff2", "regular": "fa-regular.woff2", "brands": "fa-brands.woff2"}

# Glyphes appelés directement depuis la feuille de style (content:"\fxxx") et
# non par une classe : ils n'apparaissent pas dans le HTML, il faut les citer.
EN_DUR = ["check", "plus", "minus"]


def icones_du_html():
    """Toutes les paires (famille, nom) écrites dans les pages."""
    trouve = collections.defaultdict(set)
    for page in sorted(glob.glob(os.path.join(RACINE, "*.html"))):
        with open(page, encoding="utf-8") as f:
            for m in re.finditer(r'class="(fa-solid|fa-regular|fa-brands) (fa-[a-z0-9-]+)"', f.read()):
                trouve[FAMILLE[m.group(1)]].add(m.group(2)[3:])
    return trouve


def main():
    if not os.path.isdir(PAQUET):
        sys.exit("Paquet Font Awesome introuvable : %s\n"
                 "Lancez d'abord :  npm pack @fortawesome/fontawesome-free@6 && tar xzf fortawesome-*.tgz" % PAQUET)
    import yaml
    meta = yaml.safe_load(open(os.path.join(PAQUET, "metadata", "icons.yml"), encoding="utf-8"))

    besoin = icones_du_html()
    besoin["solid"].update(EN_DUR)

    absentes, points = [], collections.defaultdict(dict)
    for fam, noms in besoin.items():
        for nom in sorted(noms):
            d = meta.get(nom)
            if not d or fam not in d.get("styles", []):
                absentes.append((fam, nom)); continue
            points[fam][nom] = d["unicode"]

    if absentes:
        print("ATTENTION — absentes de la version Free, à remplacer dans le HTML :")
        for f, n in absentes:
            print("   fa-%s fa-%s" % (f, n))

    total_avant = total_apres = 0
    for fam, icones in points.items():
        src = os.path.join(PAQUET, "webfonts", SOURCE[fam])
        out = os.path.join(FONTS, SORTIE[fam])
        subprocess.run(["pyftsubset", src,
                        "--unicodes=" + ",".join("U+" + u for u in icones.values()),
                        "--flavor=woff2", "--output-file=" + out,
                        "--no-hinting", "--desubroutinize", "--layout-features=",
                        "--drop-tables+=DSIG"], check=True)
        a, b = os.path.getsize(src), os.path.getsize(out)
        total_avant += a; total_apres += b
        print("%-8s %3d glyphes  %7d o → %6d o" % (fam, len(icones), a, b))
    print("total : %d o → %d o" % (total_avant, total_apres))

    # réécriture du bloc généré de la section 49
    tous = {}
    for fam, icones in points.items():
        tous.update(icones)
    bloc = "\n".join('.fa-%s::before{content:"\\%s"}' % (n, tous[n]) for n in sorted(tous))

    css = open(CSS, encoding="utf-8").read()
    debut = css.index(".fa-angle-right::before") if ".fa-angle-right::before" in css else None
    m = re.search(r'\.fa-[a-z0-9-]+::before\{content:"\\[0-9a-f]+"\}(\n\.fa-[a-z0-9-]+::before\{content:"\\[0-9a-f]+"\})*', css)
    if not m:
        sys.exit("Bloc des icônes introuvable dans style.css — section 49 modifiée à la main ?")
    open(CSS, "w", encoding="utf-8").write(css[:m.start()] + bloc + css[m.end():])
    print("style.css : %d règles d'icônes réécrites" % len(tous))


if __name__ == "__main__":
    main()
