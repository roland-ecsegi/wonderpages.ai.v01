import { physicalPages, printDimensions } from './printprofile.js';
export function validateFinalPdf(buffer, bp, project, { book, preset }) {
  const profile=(bp.export?.presets||[]).find(p=>p.key===preset);
  const base=book?.replace(/-cover$/,''),product=(bp.structure.books||[]).find(b=>b.key===base);
  if(!profile||!product)throw {status:400,message:'Profilul sau produsul PDF nu este cunoscut.'};
  const format=bp.formats?.[project.input?.[bp.format_key]],cover=book.endsWith('-cover'),source=buffer.toString('latin1');
  const pages=cover?1:preset==='kdp'?physicalPages(bp.structure.pages,product.mode,'kdp').length:product.mode==='combined'?2+2*bp.structure.pages:physicalPages(bp.structure.pages,product.mode,'digital',product.back_cover).length;
  const count=Number(source.match(/\/Type\s*\/Pages\b(?:(?!endobj)[\s\S])*?\/Count\s+(\d+)/)?.[1]);
  if(count!==pages)throw {status:400,message:'PDF-ul are '+count+' pagini; produsul ales cere '+pages+'.'};
  let width,height;
  if(cover){const interior=physicalPages(bp.structure.pages,product.mode,'kdp').length;width=format.trim_w_in*2+interior*(product.mode==='lineart'?0.002252:0.002347)+0.25;height=format.trim_h_in+0.25;}
  else if(preset==='kdp'){({width,height}=printDimensions(format,'kdp'));}
  else{const bleed=(profile.bleed_mm||0)/25.4;width=format.trim_w_in+2*bleed;height=format.trim_h_in+2*bleed;}
  const boxes=[...source.matchAll(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/g)];
  if(boxes.length!==pages||boxes.some(b=>Math.abs(Number(b[1])/72-width)>0.002||Math.abs(Number(b[2])/72-height)>0.002))throw {status:400,message:'Dimensiunile PDF-ului diferă de formatul ales.'};
  if(!/\/FontFile2\b/.test(source))throw {status:400,message:'PDF-ul final nu conține fontul de carte încorporat.'};
  return {pages,width,height};
}
