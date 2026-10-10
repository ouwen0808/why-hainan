const d = require('./content_fallback.json');
function len(s){ return (s||'').trim().length; }
const sections = ['heroStats','policyCards','statCards','livingCards','pathways','slides','quickGuide','quotes','footerLinks'];
for (const sec of sections) {
  const arr = d[sec] || [];
  console.log('=== '+sec+' ('+arr.length+') ===');
  arr.forEach((x,i)=>{
    const enKey = sec==='pathways' ? 'desc_en' : (sec==='quotes'?'content_en':(sec==='slides'?'sub_en':(sec==='quickGuide'?'content_en':(sec==='footerLinks'?'label_en':(sec==='heroStats'?'label_en':'content_en')))));
    const cnKey = sec==='pathways' ? 'desc_cn' : (sec==='quotes'?'content_cn':(sec==='slides'?'sub_cn':(sec==='quickGuide'?'content_cn':(sec==='footerLinks'?'label_cn':(sec==='heroStats'?'label_cn':'content_cn')))));
    const en = len(x[enKey]), cn = len(x[cnKey]);
    const title = x.title_en || x.label_en || x.name || x.cite_en || '';
    console.log(`  [${i}] en=${en} cn=${cn}  ${title}`);
  });
}
