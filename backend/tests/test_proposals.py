from fastapi.testclient import TestClient
import pytest

from app.main import app, origin
from app.db import get_db
from app.models import Proposal
from test_offers import clients, register, OFFER

TERMS = {"start_date": "2027-01-04", "end_date": "2027-03-31", "hours": 280,
         "conditions": "Lunes a viernes, modalidad híbrida. Apoyo al desarrollo."}
PDF = b"%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF"


def setup(clients):
    company, student = clients
    register(company, "empresa")
    register(student, "estudiante")
    response = company.put('/api/perfil/empresa', json={"representante": "Representante ficticio", "razon_social": "Empresa ficticia", "rut": "12.345.678-5"})
    assert response.status_code == 200
    offer = company.post('/api/ofertas', json=OFFER).json()
    application = student.post(f"/api/ofertas/{offer['id']}/postulaciones", json={}).json()
    return application['id']


def propose(clients):
    application_id = setup(clients)
    response = clients[0].post(f'/api/postulaciones/{application_id}/propuesta', json=TERMS)
    assert response.status_code == 201, response.text
    return application_id, response.json()['id']


def accept(clients):
    application_id, proposal_id = propose(clients)
    assert clients[1].post(f'/api/propuestas/{proposal_id}/respuesta', json={"status": "aceptada"}).status_code == 200
    return application_id, proposal_id


def test_complete_proposal_authorization_letter_flow(clients):
    company, student = clients
    application_id, proposal_id = accept(clients)
    path = f'/api/propuestas/{proposal_id}'
    proposal = student.get('/api/propuestas').json()[0]
    assert proposal['responded_at'] and proposal['status'] == 'aceptada'
    assert proposal['academic_status'] == 'pendiente'
    assert company.get('/api/propuestas').json()[0]['id'] == proposal_id
    assert student.put(path+'/autorizacion', json={"status": "autorizacion_informada"}).status_code == 409
    assert student.put(path+'/respaldo', content=PDF, headers={'Content-Type': 'application/pdf'}).status_code == 200
    result = student.put(path+'/autorizacion', json={"status": "autorizacion_informada", "note": "Informado por estudiante ficticio"})
    assert result.status_code == 200
    assert result.json()['academic_updated_at']
    assert company.get(path+'/respaldo').content == PDF
    assert 'attachment' in student.get(path+'/respaldo').headers['content-disposition']
    assert company.post(path+'/carta').status_code == 200
    letter = student.get(path+'/carta')
    assert letter.status_code == 200
    for value in ['Empresa ficticia', 'Representante ficticio', '2027-01-04', '280', 'No es una autorización académica']:
        assert value in letter.text
    company.put('/api/perfil/empresa', json={"representante": "Nombre modificado", "razon_social": "Otra razón", "rut": "12.345.678-5"})
    assert company.post(path+'/carta').status_code == 200
    assert student.get(path+'/carta').content == letter.content
    events = student.get(path+'/historial').json()
    assert [e['action'] for e in events] == ['propuesta_enviada','respuesta','respaldo_cargado','autorizacion_informada_por_estudiante','carta_emitida']
    assert all(e['actor_id'] and e['created_at'] for e in events)
    assert student.put(path+'/respaldo', content=PDF, headers={'Content-Type': 'application/pdf'}).json()['academic_status'] == 'en_tramite'


def test_academic_evidence_integrity_is_checked_before_private_download(clients):
    company, student = clients
    _, proposal_id = accept(clients)
    path = f'/api/propuestas/{proposal_id}/respaldo'
    assert student.put(path, content=PDF, headers={'Content-Type': 'application/pdf'}).status_code == 200
    assert student.get(path).content == PDF
    assert company.get(path).content == PDF

    test_session_context = app.dependency_overrides[get_db]()
    test_session = next(test_session_context)
    try:
        proposal = test_session.get(Proposal, proposal_id)
        proposal.evidence = PDF + b'alterado'
        test_session.commit()
    finally:
        test_session_context.close()

    assert student.get(path).status_code == 500
    assert company.get(path).status_code == 500


@pytest.mark.parametrize('response', ['aceptada', 'rechazada'])
def test_response_is_final_and_application_cannot_diverge(clients, response):
    company, student = clients
    application_id, proposal_id = propose(clients)
    path = f'/api/propuestas/{proposal_id}'
    app_path = f'/api/postulaciones/{application_id}'
    item = student.get('/api/estudiante/postulaciones').json()[0]
    assert item['allowed_statuses'] == [] and not item['can_withdraw'] and not item['can_propose']
    assert student.post(app_path+'/retirar').status_code == 409
    assert company.patch(app_path,json={'status':'rechazada'}).status_code == 409
    assert company.post(app_path+'/propuesta',json=TERMS).status_code == 409
    assert student.post(path+'/respuesta',json={'status':response}).status_code == 200
    assert student.post(path+'/respuesta',json={'status':'aceptada'}).status_code == 409
    if response == 'rechazada':
        assert company.post(path+'/carta').status_code == 409
        assert student.put(path+'/autorizacion',json={'status':'en_tramite'}).status_code == 409
        assert student.put(path+'/respaldo',content=PDF,headers={'Content-Type':'application/pdf'}).status_code == 409


@pytest.mark.parametrize('role', ['estudiante','empresa'])
def test_unrelated_accounts_cannot_access_private_proposals(clients, role):
    _, proposal_id = accept(clients)
    path = f'/api/propuestas/{proposal_id}'
    assert clients[1].put(path+'/respaldo', content=PDF, headers={'Content-Type': 'application/pdf'}).status_code == 200
    assert clients[0].post(path+'/carta').status_code == 200
    with TestClient(app,base_url='https://testserver',headers={'Origin':origin}) as other:
        register(other,role)
        assert other.get('/api/propuestas').json() == []
        for resource in ['respaldo','carta','historial']:
            assert other.get(path+'/'+resource).status_code == 404
        assert other.post(path+'/respuesta',json={'status':'aceptada'}).status_code == (404 if role=='estudiante' else 403)
        assert other.put(path+'/autorizacion',json={'status':'en_tramite'}).status_code == (404 if role=='estudiante' else 403)
        assert other.put(path+'/respaldo',content=PDF,headers={'Content-Type':'application/pdf'}).status_code == (404 if role=='estudiante' else 403)
        assert other.post(path+'/carta').status_code == (404 if role=='empresa' else 403)


def test_roles_and_pending_requirements(clients):
    company,student=clients
    app_id,pid=propose(clients)
    path=f'/api/propuestas/{pid}'
    assert student.post(f'/api/postulaciones/{app_id}/propuesta',json=TERMS).status_code==403
    assert company.post(path+'/respuesta',json={'status':'aceptada'}).status_code==403
    assert company.put(path+'/autorizacion',json={'status':'en_tramite'}).status_code==403
    assert student.post(path+'/carta').status_code==403
    assert company.post(path+'/carta').status_code==409
    assert student.put(path+'/autorizacion',json={'status':'en_tramite'}).status_code==409
    with TestClient(app) as anonymous:
        assert anonymous.get(path+'/carta').status_code==401
        assert anonymous.get(path+'/respaldo').status_code==401


@pytest.mark.parametrize('status',['rechazada','retirada'])
def test_terminal_applications_cannot_be_selected(clients,status):
    app_id=setup(clients)
    company,student=clients
    path=f'/api/postulaciones/{app_id}'
    if status=='retirada': student.post(path+'/retirar')
    else: company.patch(path,json={'status':status})
    assert company.post(path+'/propuesta',json=TERMS).status_code==409


@pytest.mark.parametrize('changes',[{'end_date':'2026-01-01'},{'hours':0},{'conditions':' '},{'start_date':'invalid'}])
def test_invalid_proposal_terms(clients,changes):
    app_id=setup(clients)
    assert clients[0].post(f'/api/postulaciones/{app_id}/propuesta',json={**TERMS,**changes}).status_code==422
    assert clients[1].get('/api/propuestas').json()==[]


@pytest.mark.parametrize('content,mime,expected',[(b'fake','application/pdf',422),(PDF,'text/html',415),(b'%PDF-'+b'a'*(2*1024*1024),'application/pdf',413)])
def test_evidence_limits(clients,content,mime,expected):
    _,pid=accept(clients)
    response=clients[1].put(f'/api/propuestas/{pid}/respaldo',content=content,headers={'Content-Type':mime})
    assert response.status_code==expected
    assert clients[1].get('/api/propuestas').json()[0]['has_evidence'] is False


def test_company_profile_required_and_selection_ownership(clients):
    app_id=setup(clients)
    company,student=clients
    with TestClient(app,base_url='https://testserver',headers={'Origin':origin}) as other:
        register(other,'empresa')
        assert other.post(f'/api/postulaciones/{app_id}/propuesta',json=TERMS).status_code==404
    company.put('/api/perfil/empresa',json={'representante':'Representante'})
    assert company.post(f'/api/postulaciones/{app_id}/propuesta',json=TERMS).status_code==409


def test_letter_escapes_user_content(clients):
    app_id=setup(clients)
    result=clients[0].post(f'/api/postulaciones/{app_id}/propuesta',json={**TERMS,'conditions':'<script>alert(1)</script> & condiciones'})
    pid=result.json()['id']
    clients[1].post(f'/api/propuestas/{pid}/respuesta',json={'status':'aceptada'})
    clients[0].post(f'/api/propuestas/{pid}/carta')
    text=clients[1].get(f'/api/propuestas/{pid}/carta').text
    assert '<script>' not in text and '&lt;script&gt;' in text
