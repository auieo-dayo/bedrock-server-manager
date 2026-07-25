
/**
 * 
 * @param {Date} date 
 * @returns {String}
 */
export function formatDate(date) {
  const pad = (n) => n.toString().padStart(2, '0');

  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1); // 月は0始まり
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());

  return `${yyyy}/${MM}/${dd} ${hh}:${mm}:${ss}`;
}
/**
 * 
 * @param {Date} start 
 * @param {Date} end 
 * @returns {String}
 */
export function msToYMDHMS(start,end) {
    let years = end.getUTCFullYear() - start.getUTCFullYear();
    let months = end.getUTCMonth() - start.getUTCMonth();
    let days = end.getUTCDate() - start.getUTCDate();
    let hours = end.getUTCHours() - start.getUTCHours();
    let minutes = end.getUTCMinutes() - start.getUTCMinutes();
    let seconds = end.getUTCSeconds() - start.getUTCSeconds();

    if (seconds < 0) { seconds += 60; minutes -= 1; }
    if (minutes < 0) { minutes += 60; hours -= 1; }
    if (hours < 0) { hours += 24; days -= 1; }
    if (days < 0) {
        const prevMonthDays = new Date(end.getUTCFullYear(), end.getUTCMonth(), 0).getUTCDate();
        days += prevMonthDays;
        months -= 1;
    }
    if (months < 0) { months += 12; years -= 1; }

    const pad = n => n.toString().padStart(2, '0');
    const parts = [];
    if (years) parts.push(`${years}年`);
    if (months) parts.push(`${months}ヶ月`);
    if (days) parts.push(`${days}日`);
    parts.push(`${pad(hours)}時間${pad(minutes)}分${pad(seconds)}秒`);

    return parts.join(' ');
}


