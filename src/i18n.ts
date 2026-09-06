export const strings = {
  forge: {
    title: 'המזקקה',
    slotEmpty: 'בחר יצור',
    merge: 'מזג',
    mergeDisabledHint: 'בחר שני יצורים',
    reset: 'אפס בחירה',
    toDeploy: 'לזירה'
  },
  deploy: {
    title: 'לזירה',
    you: 'אתה',
    rival: 'יריב',
    start: 'התחל קרב',
    back: 'חזרה למזקקה'
  },
  battle: {
    title: 'קרב',
    win: 'ניצחת!',
    lose: 'הפסדת',
    again: 'קרב נוסף',
    forge: 'חזרה למזקקה'
  },
  stat: {
    hp: 'חיים',
    atk: 'התקפה',
    spd: 'מהירות',
    tag: 'יכולת'
  },
  onboard: {
    forge: 'בחר שני יצורים — המזקקה תיצור מהם היבריד לקרב.',
    afterMerge: 'ההיבריד מוכן. לחץ לזירה כדי לפרוס אותו.',
    deploy: 'אתה משמאל (טורקיז), היריב מימין. לחץ התחל קרב.',
    battle: 'בחר יחידות והזז עם קליק ימני. קליק ימני על אויב = התקפה.',
    dismiss: 'הבנתי'
  }
};

export const colors = {
  player: 0x2DD4BF,
  playerHex: '#2DD4BF',
  rival: 0xF97316,
  rivalHex: '#F97316'
};

export function getHPColor(hpPercent: number): number {
  if (hpPercent > 0.5) return 0x00ff00;
  if (hpPercent > 0.25) return 0xffff00;
  return 0xff0000;
}
