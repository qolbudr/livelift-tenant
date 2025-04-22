import moment from "moment-timezone";

const timezone = moment().tz('Asia/Jakarta');
const fromTime = (date: string) => moment.tz(date, 'YYYY-MM-DDTHH:mm', 'Asia/Jakarta');

export default { timezone, fromTime }
