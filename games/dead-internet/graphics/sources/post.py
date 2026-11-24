# IMG09 and IMG10 are made without generative AI: render the HTML, then age it.
#   cd games/dead-internet/graphics/sources && node shoot.cjs && python3 post.py
# Writes img09.webp and img10.webp here; copy them to assets/images/ under the catalog names.
import numpy as np, io, random
from PIL import Image, ImageDraw, ImageFilter
rng=np.random.default_rng(7)
def coeffs(dst, src):
    # maps output (dst) points to input (src) points
    A=[];B=[]
    for (x,y),(u,v) in zip(dst,src):
        A.append([x,y,1,0,0,0,-u*x,-u*y]); B.append(u)
        A.append([0,0,0,x,y,1,-v*x,-v*y]); B.append(v)
    return np.linalg.solve(np.array(A,float),np.array(B,float)).tolist()
def jpeg(im,q):
    b=io.BytesIO(); im.save(b,'JPEG',quality=q); b.seek(0); return Image.open(b).convert('RGB')

# ---------- IMG09: phone photo of a laptop screen ----------
W,H=1080,1440
dash=Image.open('dashboard.png').convert('RGB')
y,x=np.mgrid[0:H,0:W]
bg=np.zeros((H,W,3)); g=np.exp(-(((x-200)/800)**2+((y+100)/500)**2))
bg[...,0]=24+50*g; bg[...,1]=22+38*g; bg[...,2]=26+26*g
canvas=Image.fromarray(bg.clip(0,255).astype('uint8'))
# keyboard deck, out of focus, drawn on its own layer then blurred
kb=Image.new('RGB',(W,H),(0,0,0)); kd=ImageDraw.Draw(kb)
kd.polygon([(-40,1080),(1120,1040),(1300,1440),(-220,1440)],fill=(96,98,102))
for r in range(4):
    for c in range(16):
        t=r/4; y0=1112+r*86+r*r*6; w=58+t*14; x0=-30+c*(w+12)-t*60
        kd.rounded_rectangle([x0,y0,x0+w,y0+62+r*5],radius=7,fill=(34,35,38))
kb=kb.filter(ImageFilter.GaussianBlur(7))
kmask=Image.new('L',(W,H),0); ImageDraw.Draw(kmask).polygon([(-40,1080),(1120,1040),(1300,1440),(-220,1440)],fill=255)
kmask=kmask.filter(ImageFilter.GaussianBlur(5))
canvas=Image.composite(kb,canvas,kmask)
d=ImageDraw.Draw(canvas)
bez=[(-40,250),(1120,214),(1130,1050),(-50,1086)]
d.polygon(bez,fill=(14,14,16))
d.ellipse([536,226,548,238],fill=(30,30,34))   # webcam
scr=[(-12,286),(1094,252),(1104,1012),(-22,1046)]   # screen corners, edges just outside the frame
screen=dash.transform((W,H),Image.PERSPECTIVE,coeffs(scr,[(0,0),(1440,0),(1440,900),(0,900)]),Image.BICUBIC)
mask=Image.new('L',(W,H),0); ImageDraw.Draw(mask).polygon(scr,fill=255)
s=np.asarray(screen,float)
# moiré: the screen's pixel grid beating against the sensor, soft coloured bands
for ch,ph in ((0,0.0),(1,2.1),(2,4.2)):
    mo=np.sin(x*1.37+y*0.41+ph)*np.sin(x*0.43-y*1.33+ph*0.5)
    beat=0.5+0.5*np.sin((x*0.021+y*0.034)+ph)
    s[...,ch]*=1-0.10*beat*(0.5+0.5*mo)
s*= (0.84+0.16*np.exp(-(((x-520)/700)**2+((y-620)/460)**2)))[...,None]
gl=np.exp(-(((x+y*0.55)-1250)/120.0)**2)*22; s+=gl[...,None]
s[...,2]+=5
canvas=Image.composite(Image.fromarray(s.clip(0,255).astype('uint8')),canvas,mask)
a=np.asarray(canvas,float); a+=rng.normal(0,5,a.shape)
canvas=Image.fromarray(a.clip(0,255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.6))
jpeg(canvas,82).save('img09.webp','WEBP',quality=86,method=6)

# ---------- IMG10: slightly skewed scan ----------
inv=Image.open('invoice.png').convert('RGB')
W,H=1240,1754
page=inv.resize((1190,1684),Image.LANCZOS).rotate(0.9,resample=Image.BICUBIC,expand=True,fillcolor=(250,250,248))
bed=Image.new('RGB',(W,H),(214,214,210))
pw,ph=page.size; bed.paste(page,(22,18))
a=np.asarray(bed,float)
yy,xx=np.mgrid[0:H,0:W]
a*= (0.97+0.03*np.cos(xx/W*np.pi*1.2))[...,None]          # uneven scanner light
a[...,2]-=4; a+=rng.normal(0,3.5,a.shape)
a=np.where(a>236, a*0.995+1.5, a)                          # paper not pure white
scan=Image.fromarray(a.clip(0,255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.55))
jpeg(scan,80).save('img10.webp','WEBP',quality=86,method=6)
print('ok')
