#!/usr/bin/env python3
"""One-time true redaction of specified surnames in CRCC S3 PDFs.
Only invoked when temporary signed upload URLs are supplied by the operator.
Documents are redacted and verified BEFORE any upload begins.
"""
import json
import os
import re
import subprocess
import sys
import tempfile
from collections import Counter
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
SURNAMES=('MONCHANY','SAMSON','HOUMMADI','BARTHOLOMET','GALLINEAU')
PDFS=(
  'documents/louis/fiche-1.pdf',
  'documents/seances/2026-10-19-cao-gold-robusto/fiche-julien-1.pdf',
  'documents/seances/2026-10-19-cao-gold-robusto/fiche-louis-2.pdf',
  'documents/seances/2026-10-19-cao-gold-robusto/minutes.pdf',
  'documents/seances/2026-10-21-don-tomas-clasico-robusto/fiche-julien-2.pdf',
  'documents/seances/2026-10-21-don-tomas-clasico-robusto/fiche-louis-3.pdf',
  'documents/seances/2026-10-21-don-tomas-clasico-robusto/minutes.pdf',
)

def main():
    urls=[os.environ.get('CRCC_REDACT_UPLOAD_'+str(i),'') for i in range(len(PDFS))]
    if not any(urls):
        return
    if not all(urls):
        raise RuntimeError('Partial redaction upload URL configuration: stopping safely')
    try:
        import fitz
    except ImportError:
        subprocess.run([sys.executable,'-m','pip','install','--quiet','PyMuPDF==1.26.7'],check=True)
        import fitz

    output=[]
    with tempfile.TemporaryDirectory(prefix='crcc-redactions-') as tmp:
        for key,upload_url in zip(PDFS,urls):
            source=ROOT/key
            if not source.is_file():
                raise RuntimeError('Missing source PDF: '+key)
            pdf=fitz.open(source)
            found=Counter()
            extraction_chars=0
            for pg in pdf:
                extraction_chars+=len(pg.get_text())
                rects=[]
                for surname in SURNAMES:
                    for rect in pg.search_for(surname):
                        rects.append((surname,rect))
                for surname,rect in rects:
                    pg.add_redact_annot(rect,fill=(0,0,0),cross_out=False)
                    found[surname]+=1
                if rects:
                    pg.apply_redactions(
                        images=fitz.PDF_REDACT_IMAGE_PIXELS,
                        graphics=fitz.PDF_REDACT_LINE_ART_NONE,
                        text=fitz.PDF_REDACT_TEXT_REMOVE
                    )
            # Never claim safe redaction on image-only PDFs without optical verification.
            if extraction_chars<20:
                raise RuntimeError('Image-only or non-extractable PDF; manual image redaction required: '+key)
            dest=Path(tmp)/(Path(key).stem+'-'+str(len(output))+'.pdf')
            pdf.save(dest,garbage=4,clean=True,deflate=True)
            pdf.close()
            check=fitz.open(dest)
            text='\n'.join(page.get_text() for page in check).upper()
            check.close()
            remaining=[surname for surname in SURNAMES if re.search(r'(?<!\w)'+surname+r'(?!\w)',text)]
            if remaining:
                raise RuntimeError('Unredacted text remains in '+key+': '+repr(remaining))
            output.append((key,dest,upload_url,dict(found)))
        # Validation completed on every PDF; no originals are overwritten until here.
        for key,path,url,counts in output:
            # PDFs with no matching surnames are left byte-for-byte unchanged on S3.
            if not counts:
                print('UNCHANGED '+key+' (no matching surname in text)')
                continue
            data=path.read_bytes()
            request=Request(url,data=data,method='PUT',headers={'Content-Type':'application/pdf'})
            try:
                with urlopen(request,timeout=45) as response:
                    if response.status not in (200,201,204):
                        raise RuntimeError('S3 upload failed '+key+': '+str(response.status))
            except Exception as exc:
                raise RuntimeError('S3 upload failed for '+key) from exc
            print('REDACTED '+key+' '+repr(counts)+' bytes='+str(len(data)))

if __name__=='__main__':
    main()
