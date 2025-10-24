import { useEffect, useRef } from "react";

function hsv(i){ const h=(i*0.618)%1; const f=(n)=>Math.max(0,Math.min(1,Math.abs((h*6-n)%6-3)-1));
  const v=0.95,s=0.65; const r=v*(1-s*f(5)), g=v*(1-s*f(3)), b=v*(1-s*f(1));
  return [Math.round(r*255),Math.round(g*255),Math.round(b*255)]; }

export default function OTMapViewer({ mode, owner, densityFrame, width, height, sites, frameIndex=0 }){
  const canvasRef = useRef(null);
  useEffect(()=>{
    const canvas = canvasRef.current;
    if(!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d",{alpha:false});
    const image = ctx.createImageData(width,height);
    if(mode==='semidiscrete' && owner){
      const palette = sites.map((_,i)=> hsv(i));
      for(let i=0;i<owner.length;i++){
        const c = palette[owner[i] % palette.length];
        image.data[4*i]=c[0];
        image.data[4*i+1]=c[1];
        image.data[4*i+2]=c[2];
        image.data[4*i+3]=255;
      }
      ctx.putImageData(image,0,0);
      ctx.strokeStyle="#111";
      ctx.lineWidth=1;
      sites.forEach((s)=>{ ctx.beginPath(); ctx.arc(s.x,s.y,3,0,Math.PI*2); ctx.stroke(); });
    } else if(mode==='dynamic' && densityFrame){
      const data = densityFrame.data;
      let max=0; for(let i=0;i<data.length;i++){ if(data[i]>max) max=data[i]; }
      const inv = max>0?1/max:1;
      for(let i=0;i<data.length;i++){
        const v=Math.min(255,Math.round(255*data[i]*inv));
        image.data[4*i]=v;
        image.data[4*i+1]=v;
        image.data[4*i+2]=v;
        image.data[4*i+3]=255;
      }
      ctx.putImageData(image,0,0);
    }
  },[mode, owner, densityFrame, width, height, sites, frameIndex]);
  return (
    <div className="border border-white/10 rounded-md overflow-hidden">
      <canvas ref={canvasRef} style={{width:"100%", imageRendering:"pixelated"}} />
    </div>
  );
}
