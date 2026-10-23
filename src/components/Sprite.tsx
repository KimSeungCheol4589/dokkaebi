// 문자열 격자로 그리는 도트 그림. 각 글자가 팔레트의 색 하나에 대응합니다 ('.' 은 투명).

const PALETTE: Record<string, string> = {
  k: '#2a1d14', // 외곽선
  r: '#d9483b', // 도깨비 피부
  R: '#9e2b25', // 그림자
  y: '#f2d27a', // 뿔
  Y: '#c9a24a',
  w: '#fff8e8', // 눈·이빨
  g: '#2f8f7f', // 옷
  G: '#1f5f55',
  o: '#9a6a34', // 방망이
  O: '#6b4520',
  s: '#f0b847', // 징
  b: '#6fd3ff', // 도깨비불
  B: '#2f7fd8',
  c: '#dff6ff',
};

export const DOKKAEBI = [
  '..k..........k......',
  '.kyk........kyk.....',
  '.kYyk.kkkk.kyYk.....',
  '..kYkkrrrrkkYk......',
  '..krrrrrrrrrrk..koo.',
  '.krrwwrrrrwwrrk.kooo',
  '.krrwkrrrrwkrrk.koOo',
  '.kRrrrrRRrrrrRk.koOk',
  '.krrkwkkkkwkrrk..kok',
  '..krrkwwwwkrrk...kok',
  '...kkrrrrrrkk....kok',
  '..kggkkkkkkggk..krk.',
  '.kgggggsgggggggkrrk.',
  '.kgGgggsggggggGkrk..',
  '.krkGggggggggGkk....',
  '.krkkGGgggGGkk......',
  '..k.krrk..krrk......',
  '....kkkk..kkkk......',
];

export const FIRE = [
  '...b...',
  '..bb...',
  '..bcb..',
  '.bccbb.',
  '.bcccb.',
  'bBcccBb',
  'bBBcBBb',
  '.bBBBb.',
  '..bbb..',
];

export const SMALL_DOKKAEBI = [
  '.k......k.',
  'kyk....kyk',
  '.kkrrrrkk.',
  '.krrrrrrk.',
  'krwkrrwkrk',
  'krrrrrrrrk',
  'krwkkkkwrk',
  '.krrrrrrk.',
  '..kkkkkk..',
];

export function Sprite({
  map,
  scale = 4,
  className,
  title,
}: {
  map: string[];
  scale?: number;
  className?: string;
  title?: string;
}) {
  const width = Math.max(...map.map((r) => r.length));
  const rects: { x: number; y: number; w: number; c: string }[] = [];
  map.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let run = 1;
      while (row[x + run] === ch) run++;
      if (ch !== '.' && PALETTE[ch]) rects.push({ x, y, w: run, c: PALETTE[ch] });
      x += run;
    }
  });
  return (
    <svg
      className={className}
      width={width * scale}
      height={map.length * scale}
      viewBox={`0 0 ${width} ${map.length}`}
      shapeRendering="crispEdges"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} />
      ))}
    </svg>
  );
}
