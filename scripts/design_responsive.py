from playwright.sync_api import sync_playwright, expect
from uuid import uuid4
suffix=uuid4().hex[:10]
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge',headless=True)
 company=browser.new_page(); student=browser.new_page()
 def register(page,role):
  email=f'{role}-{suffix}@example.com'
  page.goto('http://localhost:5175')
  page.get_by_role('button',name='Crear una cuenta',exact=True).click()
  page.get_by_label('Tipo de cuenta').select_option(role)
  page.get_by_label('Nombre del representante' if role=='empresa' else 'Nombre completo').fill('Prueba navegador '+role)
  page.get_by_label('Correo electrónico').fill(email)
  page.get_by_label('Contraseña',exact=True).fill('Clave ficticia navegador 2026')
  page.get_by_role('button',name='Crear cuenta',exact=True).click()
  expect(page.get_by_role('button',name='Cerrar sesión',exact=True)).to_be_visible()
  page.get_by_role('button',name='Cerrar sesión',exact=True).click()
  page.get_by_label('Correo electrónico').fill(email)
  page.get_by_label('Contraseña',exact=True).fill('Clave ficticia navegador 2026')
  page.get_by_role('button',name='Ingresar',exact=True).click()
  expect(page.get_by_role('button',name='Cerrar sesión',exact=True)).to_be_visible()
  print('PASS registro/login '+role,flush=True)
 register(company,'empresa');register(student,'estudiante')
 form=company.locator('form.offer-form')
 for label,value in [('Título','Oferta navegador '+suffix),('Área','Tecnología'),('Descripción','Desarrollo de una aplicación de prueba'),('Requisitos','Conocimientos de Python'),('Horas de práctica','280')]: form.get_by_label(label,exact=True).fill(value)
 form.get_by_role('button',name='Publicar oferta',exact=True).click()
 expect(company.get_by_role('heading',name='Oferta navegador '+suffix,exact=True)).to_be_visible()
 assert company.get_by_role('alert').count()==0, company.get_by_role('alert').all_text_contents()
 student.reload()
 card=student.locator('article.offer').filter(has=student.get_by_role('heading',name='Oferta navegador '+suffix,exact=True))
 card.get_by_role('button',name='Postular',exact=True).click()
 expect(card.get_by_role('button',name='Ya postulaste')).to_be_disabled()
 company.locator('article.offer').filter(has=company.get_by_role('heading',name='Oferta navegador '+suffix,exact=True)).get_by_role('button',name='Ver postulaciones').click()
 expect(company.get_by_text('Prueba navegador estudiante',exact=True)).to_be_visible()
 company.screenshot(path='.local-check/pct43-company.png',full_page=True)
 student.screenshot(path='.local-check/pct43-student.png',full_page=True)
 print('PASS publicación/postulación y consulta empresarial',flush=True)
 page=student
 for width,height in [(390,844),(768,1024),(1024,768),(1440,900)]:
  page.set_viewport_size({'width':width,'height':height})
  page.goto('http://localhost:5175')
  expect(page.get_by_role('heading',name='Perfil de estudiante',exact=True)).to_be_visible()
  expect(page.get_by_label('Nombre completo (obligatorio)',exact=True)).to_be_visible()
  theme=page.evaluate('getComputedStyle(document.body).backgroundColor')
  assert theme=='rgb(237, 241, 236)', f'visual identity stylesheet not applied: {theme}'
  overflow=page.evaluate('document.documentElement.scrollWidth > window.innerWidth')
  assert not overflow, f'horizontal overflow at {width}px'
  if width==390: page.screenshot(path='.local-check/pct43-mobile.png',full_page=True)
  if width==1440: page.screenshot(path='.local-check/pct43-desktop.png',full_page=True)
  print(f'PASS responsive {width}x{height}',flush=True)
 browser.close()
