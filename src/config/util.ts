export class Util {
    static getRandomAlphaNumericString = function (len: any, an: any) {
        an = an && an.toLowerCase();
        let str = "",
            i = 0;
        const min = an == "a" ? 10 : 0;
        const max = an == "n" ? 10 : 62;
        for (; i++ < len;) {
            let r = Math.random() * (max - min) + min << 0;
            str += String.fromCharCode(r += r > 9 ? r < 36 ? 55 : 61 : 48);
        }
        return str;
    }
}

