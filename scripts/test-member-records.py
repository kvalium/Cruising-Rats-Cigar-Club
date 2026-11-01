"""Record units and proof links must follow the winning archived measurement."""
import importlib.util
from pathlib import Path
from types import SimpleNamespace

spec=importlib.util.spec_from_file_location('members',Path(__file__).with_name('member-pages.py'))
members=importlib.util.module_from_spec(spec)
spec.loader.exec_module(members)
archive=SimpleNamespace(member_url=lambda p:'membre-'+p['id']+'.html')
people={'julien':{'id':'julien','name':'Julien'}}
photo='https://assets.example/ash.webp'
sheet={'member_id':'julien','ash_max_cm':2.3,'ash_evidence':{'photo_src':photo}}
session={'date':'2026-10-31','participants':[people['julien']],'sheets':[sheet],'photos':[{'src':photo}]}
html=members.record_html(people,[session],archive)
assert '<strong>23 mm</strong>' in html
assert 'href="'+photo+'"' in html and 'Voir la photo' in html
assert 'href="membre-julien.html"' in html
sheet['ash_evidence']['photo_src']='javascript:alert(1)'
assert 'javascript:' not in members.record_html(people,[session],archive)
sheet['ash_max_cm']=None
html=members.record_html(people,[session],archive)
assert '<th>Cendre la plus longue</th><td>Non homologué' in html
assert 'Voir la photo' not in html
facts=members.facts_for(people['julien'],[session])
assert 'cendre-longue' not in members.awards_for(people['julien'],facts)
awarded={**people['julien'],'distinctions':['cendre-longue','unknown-award']}
assert members.awards_for(awarded,facts)=={'cendre-longue'}
assert 'Ordre de la Cendre Longue' in members.medal_html(awarded,facts)
assert 'unknown-award' not in members.medal_html(awarded,facts)
print('Member records checks passed: cm/mm conversion, winning proof, missing measures and unrelated links.')
