#!/usr/bin/env python3
"""판다 면제 조항 게임 빌드: 쓰인 글자만 남긴 갈무리 글꼴을 넣어 단일 HTML을 만든다.

사용법:
    pip install fonttools brotli
    python3 build.py            # 글꼴이 없으면 npm에서 galmuri 패키지를 받아 온다

결과:
    index.html     – 바로 열 수 있는 완성본 (<!doctype html> 포함, 인터넷 없이 돈다)
    dist/page.html – 머리말 없이 본문만 있는 판 (Claude Artifact 게시용)
"""
import base64, io, os, tarfile, urllib.request, json

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'src')
CACHE = os.path.join(HERE, '.fontcache')
FACES = [  # (css family, weight, file)
    ('Galmuri7', 400, 'Galmuri7.ttf'),
    ('Galmuri9', 400, 'Galmuri9.ttf'),
    ('Galmuri11', 400, 'Galmuri11.ttf'),
    ('Galmuri11', 700, 'Galmuri11-Bold.ttf'),
    ('Galmuri14', 400, 'Galmuri14.ttf'),
]


def ensure_fonts():
    if all(os.path.exists(os.path.join(CACHE, f)) for _, _, f in FACES):
        return
    os.makedirs(CACHE, exist_ok=True)
    meta = json.load(urllib.request.urlopen('https://registry.npmjs.org/galmuri/latest'))
    data = urllib.request.urlopen(meta['dist']['tarball']).read()
    with tarfile.open(fileobj=io.BytesIO(data)) as t:
        for _, _, f in FACES:
            m = t.getmember('package/dist/' + f)
            with open(os.path.join(CACHE, f), 'wb') as out:
                out.write(t.extractfile(m).read())


def subset(path, chars):
    from fontTools import subset as fs
    opts = fs.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    font = fs.load_font(path, opts)
    s = fs.Subsetter(opts)
    s.populate(text=chars)
    s.subset(font)
    buf = io.BytesIO()
    fs.save_font(font, buf, opts)
    return buf.getvalue()


def main():
    ensure_fonts()
    page = open(os.path.join(SRC, 'page.html'), encoding='utf-8').read()
    # 공통 → 장면 → 진행 순서로 이어 붙여 한 스크립트로 감싼다
    # 애니메이션의 공통 그림(common.js)과 러바오 그림(panda.js)을 먼저 붙이고 게임을 잇는다
    shared = os.path.join(HERE, '..', 'panda-clause', 'src')
    parts = [os.path.join(shared, 'common.js'), os.path.join(shared, 'panda.js'), os.path.join(SRC, 'game.js')]
    game = "'use strict';\n(() => {\n" + '\n'.join(open(f, encoding='utf-8').read() for f in parts) + '})();\n'
    chars = set(page + game)
    chars |= set(chr(c) for c in range(0x20, 0x7f))
    chars = ''.join(sorted(c for c in chars if c >= ' '))
    css = []
    total = 0
    for fam, wt, f in FACES:
        woff = subset(os.path.join(CACHE, f), chars)
        total += len(woff)
        b64 = base64.b64encode(woff).decode()
        css.append("@font-face{font-family:'%s';font-weight:%d;font-display:block;"
                   "src:url(data:font/woff2;base64,%s) format('woff2');}" % (fam, wt, b64))
    body = page.replace('/*FONTFACE*/', '\n'.join(css)).replace('/*GAME*/', game)
    os.makedirs(os.path.join(HERE, 'dist'), exist_ok=True)
    with open(os.path.join(HERE, 'dist', 'page.html'), 'w', encoding='utf-8') as fp:
        fp.write(body)
    full = ('<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + body.replace('<div class="wrap">', '</head>\n<body>\n<div class="wrap">', 1)
            + '</body>\n</html>\n')
    with open(os.path.join(HERE, 'index.html'), 'w', encoding='utf-8') as fp:
        fp.write(full)
    print('glyphs:', len(chars), '| fonts:', total // 1024, 'KB | index.html:', len(full.encode()) // 1024, 'KB')


if __name__ == '__main__':
    main()
