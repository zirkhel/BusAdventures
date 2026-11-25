from PIL import Image, ImageFilter, ImageEnhance, ImageChops
import io, os, random
import numpy as np
G='gen'; OUT='/workspace/BusAdventures/games/dead-internet/assets/images'
os.makedirs('final',exist_ok=True)
def grain(im, s=3.0, seed=1):
    a=np.asarray(im).astype(np.float32)
    rng=np.random.default_rng(seed)
    n=rng.normal(0,s,a.shape[:2])[...,None]
    return Image.fromarray(np.clip(a+n,0,255).astype(np.uint8))
def jpeg(im,q):
    b=io.BytesIO(); im.save(b,'JPEG',quality=q); b.seek(0); return Image.open(b).convert('RGB')
def blurbox(im,box,r):
    reg=im.crop(box).filter(ImageFilter.GaussianBlur(r)); im.paste(reg,box[:2]); return im
def load(n): return Image.open(f'{G}/{n}.jpg').convert('RGB')
def save(im,n,size,q=82):
    im=im.resize(size,Image.LANCZOS)
    im.save(f'{OUT}/{n}.webp','WEBP',quality=q,method=6); im.save(f'final/{n}.webp','WEBP',quality=q)
HERO=(1600,900); PHONE=(1440,1080)
plain={'web0001-foundry-lofts','web0002-heights-commons','web0003-northpoint-landing','web0006-brightline-case-phone','web0008-kestrel-warehouse','web0012-recycling-truck','web0013-lighthouse-fog','web0014-old-town-street','web0015-calder-creek','web0021-caldercu-counters','web0022-smart-meter','web0029-garden-beds','web0031-library-reading-room','web0032-calderpower-pylons','web0033-caldercu-front','web0035-harborpa-desk','web0038-market-row'}
for n in sorted(plain):
    im=load(n).resize(HERO,Image.LANCZOS); save(grain(im,2.5),n,HERO)
# phone photos
for n in ['web0016-reading-circle-shelf','web0017-fog-pier2','web0018-duck-race','web0019-book-bus']:
    im=load(n).resize(PHONE,Image.LANCZOS); save(jpeg(grain(im,4),70),n,PHONE)
im=load('web0037-notes-fog').resize(HERO,Image.LANCZOS); save(jpeg(grain(im,4),70),'web0037-notes-fog',HERO)
# library: soften the door notice so nothing reads
im=load('web0011-eastfield-library'); im=blurbox(im,(728,312,806,412),6); im=blurbox(im,(735,320,800,405),3)
save(grain(im.resize(HERO,Image.LANCZOS),2.5),'web0011-eastfield-library',HERO)
# harbordesk: remove the fruit-like mark on the laptop lid
im=load('web0028-harbordesk-window'); im=blurbox(im,(628,535,670,568),10); im=blurbox(im,(632,538,666,565),10)
save(grain(im.resize(HERO,Image.LANCZOS),2.5),'web0028-harbordesk-window',HERO)
# northgate lobby: mount LOGO_NORTHGATE (brass) on the blank navy wall
im=load('web0004-northgate-lobby').convert('RGBA')
logo=Image.open('ng-brass.png').convert('RGBA'); bb=logo.getbbox(); logo=logo.crop(bb)
h=190; w=int(logo.width*h/logo.height); logo=logo.resize((w,h),Image.LANCZOS)
# light falloff from the picture lights above
a=np.asarray(logo).astype(np.float32); grad=np.linspace(1.08,0.78,h)[:,None]; a[...,:3]*=grad[...,None]; logo=Image.fromarray(np.clip(a,0,255).astype(np.uint8))
cx,cy=637,262; x=cx-w//2; y=cy-h//2
sh=Image.new('RGBA',logo.size,(0,0,0,0)); alpha=logo.split()[3].point(lambda v:int(v*0.55)); sh.putalpha(alpha)
sh=sh.filter(ImageFilter.GaussianBlur(3)); im.alpha_composite(sh,(x+3,y+5)); im.alpha_composite(logo,(x,y))
im=im.convert('RGB').filter(ImageFilter.GaussianBlur(0.4))
save(grain(im.resize(HERO,Image.LANCZOS),2.5),'web0004-northgate-lobby',HERO)
# kestrel 2014: cheap compact camera, low resolution
im=load('web0009-kestrel-2014').resize((640,480),Image.BILINEAR); im=jpeg(im,38); im=ImageEnhance.Color(im).enhance(0.85)
save(im.resize((1024,768),Image.BILINEAR),'web0009-kestrel-2014',(1024,768),q=78)
# walt 1987 scan
im=load('web0023-festival-1987').resize((720,540),Image.BILINEAR); im=jpeg(grain(im,5),55)
save(im.resize((1024,768),Image.BILINEAR),'web0023-festival-1987',(1024,768),q=78)
# walt 2008 digicam
im=load('web0034-walts-2008').resize((800,600),Image.BILINEAR); im=jpeg(im,45)
save(im.resize((1024,768),Image.BILINEAR),'web0034-walts-2008',(1024,768),q=78)
# faceless sheet + tiles
im=load('web0024-faceless-sheet'); save(im,'web0024-faceless-sheet',(1600,1200),q=85)
os.makedirs('/workspace/BusAdventures/games/dead-internet/graphics/sources/web0024-tiles',exist_ok=True)
W,H=im.size; tw=W/4; th=H/3
for r in range(3):
    for c in range(4):
        box=(int(c*tw+6),int(r*th+6),int((c+1)*tw-6),int((r+1)*th-6))
        t=im.crop(box); s=min(t.size); t=t.crop(((t.width-s)//2,0,(t.width-s)//2+s,s)).resize((512,512),Image.LANCZOS)
        t.save(f'/workspace/BusAdventures/games/dead-internet/graphics/sources/web0024-tiles/web0024-{r*4+c+1:02d}.webp','WEBP',quality=85)
print('done')
# calder cu counters: paint out a teal ring mark on the wall (too close to Harbor Dental's wave mark)
im=load('web0021-caldercu-counters'); a=np.asarray(im).astype(np.float32); x0,y0,x1,y1=255,82,385,225
L=a[y0:y1,x0-6:x0].mean(axis=1); R=a[y0:y1,x1:x1+6].mean(axis=1); t=np.linspace(0,1,x1-x0)[None,:,None]
a[y0:y1,x0:x1]=L[:,None,:]*(1-t)+R[:,None,:]*t; im=blurbox(Image.fromarray(a.astype(np.uint8)),(x0-4,y0-4,x1+4,y1+4),2)
save(grain(im.resize(HERO,Image.LANCZOS),2.5),'web0021-caldercu-counters',HERO)
