export function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

export function shadeHexColor(color, percent) {
    const rgb_color = HexToRGB(color)
    const shaded_rgb_color = shadeRGBColor(
        rgb_color.r, 
        rgb_color.g, 
        rgb_color.b, 
        percent,
    );
    return RGBToHex(
        shaded_rgb_color.r, 
        shaded_rgb_color.g, 
        shaded_rgb_color.b, 
    )
}

export function shadeRGBColor(R, G, B, percent) {
    var t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent
    return {
        r: (Math.round((t - R) * p) + R),
        g: (Math.round((t - G) * p) + G),
        b: (Math.round((t - B) * p) + B),
    }
}

function HexToRGB(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function RGBToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}