#!/usr/bin/env python3
"""rira-shift/src/game.js 의 공통 부분(화면·색·글꼴·소리·픽셀 격자·리라·갓파더·사람·앞발 그림)을 src/common.js 로 옮겨 온다.

리라나 갓파더 그림을 게임 쪽에서 고친 뒤 이 스크립트를 돌리고 build.py 를 다시 돌리면 두 작품의 그림이 같아진다.
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'rira-shift', 'src', 'game.js')

lines = open(SRC, encoding='utf-8').read().split('\n')


def find(prefix):
    for i, l in enumerate(lines):
        if l.startswith(prefix):
            return i
    raise SystemExit('찾을 수 없음: ' + prefix)


def part(a, b):
    return '\n'.join(lines[find(a):find(b)])


s = '\n'.join([
    '// 판다 면제 조항 — 공통 부분: 화면 맞추기, 색, 글꼴, 소리, 픽셀 격자, 리라·갓파더 그림',
    '// (sync_common.py 가 퇴근 불가 rira-shift/src/game.js 에서 그대로 옮겨 온다. 여기서 고치지 말 것)',
    part('const W = 320', '// ---------- 저장'),
    'const G = { music: true, sfx: true };',
    part('// ---------- 소리: WebAudio', '// ---------- 픽셀 격자'),
    part('// ---------- 픽셀 격자', '// ---------- 소품 (역: 스테이션)'),
]) + '\n'
hat = '    if (sg.hat && (pos === 1 || pos === 3)) noise('
assert s.count(hat) == 1
# 러바오 테마의 목탁 소리 (게임에는 없는 악기)
s = s.replace(hat, "    if (sg.block && (pos === 0 || pos === 2)) tone(pos ? 880 : 1320, .04, { at: t, w: 'square', v: .03, bus: AU.mus });\n" + hat)
open(os.path.join(HERE, 'src', 'common.js'), 'w', encoding='utf-8').write(s)
print('src/common.js:', len(s.split('\n')), 'lines')
