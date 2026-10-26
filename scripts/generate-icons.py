"""Draws the app icon, Android adaptive icon layers, splash image and favicon into assets/.

The icon is the first Tamil letter, அ, in Mukta Malar on the app's teal.
Run from the repo root after `npm install` (it reads the font from node_modules).
"""
from PIL import Image, ImageDraw, ImageFont

TEAL = (14, 107, 99, 255)
CREAM = (250, 247, 240, 255)
WHITE = (255, 255, 255, 255)
FONT = 'node_modules/@expo-google-fonts/mukta-malar/600SemiBold/MuktaMalar_600SemiBold.ttf'
LETTER = 'அ'


def letter(size, scale, color, bg=None):
    """A square image with அ centred by its ink box, about `scale` of the width."""
    img = Image.new('RGBA', (size, size), bg or (0, 0, 0, 0))
    font = ImageFont.truetype(FONT, int(size * scale * 1.35))
    draw = ImageDraw.Draw(img)
    l, t, r, b = draw.textbbox((0, 0), LETTER, font=font)
    w, h = r - l, b - t
    # Fit the ink box to `scale` of the canvas whatever the font's metrics.
    font = ImageFont.truetype(FONT, int(font.size * size * scale / max(w, h)))
    l, t, r, b = draw.textbbox((0, 0), LETTER, font=font)
    draw.text(((size - (r - l)) / 2 - l, (size - (b - t)) / 2 - t), LETTER, font=font, fill=color)
    return img


letter(1024, 0.64, CREAM, TEAL).convert('RGB').save('assets/icon.png')
# Android crops adaptive icons to a circle or squircle inside the middle 66%, so the letter stays small.
letter(512, 0.44, CREAM).save('assets/android-icon-foreground.png')
Image.new('RGBA', (512, 512), TEAL).save('assets/android-icon-background.png')
letter(432, 0.44, WHITE).save('assets/android-icon-monochrome.png')
letter(1024, 0.6, CREAM).save('assets/splash-icon.png')
letter(48, 0.62, CREAM, TEAL).save('assets/favicon.png')
print('icons written to assets/')
# The home-screen web app (scripts/build-web.mjs) picks these up from public/.
letter(180, 0.64, CREAM, TEAL).convert('RGB').save('public/apple-touch-icon.png')
letter(192, 0.64, CREAM, TEAL).convert('RGB').save('public/icon-192.png')
letter(512, 0.64, CREAM, TEAL).convert('RGB').save('public/icon-512.png')
print('web app icons written to public/')
