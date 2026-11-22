export function Icon({ name, size = 22 }: { name: 'wave' | 'arrow' | 'fish' | 'boat' | 'clock' | 'check' | 'grid'; size?: number }) {
  const paths = {
    wave: 'M2 8c3-5 7 5 10 0s7 5 10 0M2 15c3-5 7 5 10 0s7 5 10 0',
    arrow: 'M4 12h15m-6-6 6 6-6 6',
    fish: 'M17 12c-4-7-11-7-15 0 4 7 11 7 15 0Zm0 0 5-5v10l-5-5ZM7 10v.01',
    boat: 'M3 13h18l-4 7H7l-4-7ZM12 3v10M12 3l6 7h-6M2 22c3-3 5 3 8 0s5 3 8 0 4 0 4 0',
    clock: 'M12 8v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    check: 'm5 12 4 4L19 6',
    grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]} /></svg>
}