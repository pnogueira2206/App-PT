"""Envia um ficheiro de backup para uma pasta do Google Drive e apaga
backups com mais de 30 dias nessa mesma pasta.

Usa uma conta de serviço (Service Account) do Google Cloud — a pasta de
destino no Drive tem de estar partilhada com o email dessa conta de
serviço (com permissão de Editor), já que uma conta de serviço não tem
armazenamento Drive próprio.

Espera as variáveis de ambiente:
  GDRIVE_SERVICE_ACCOUNT_JSON — conteúdo completo do ficheiro JSON da chave
  GDRIVE_FOLDER_ID            — ID da pasta de destino no Drive

Uso: python3 enviar_backup_drive.py <caminho-do-ficheiro>
"""

import datetime
import json
import os
import sys

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

SCOPES = ["https://www.googleapis.com/auth/drive"]
DIAS_A_MANTER = 30
PREFIXO = "backup-cfa-"


def obter_servico():
    info = json.loads(os.environ["GDRIVE_SERVICE_ACCOUNT_JSON"])
    credenciais = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
    return build("drive", "v3", credentials=credenciais)


def enviar(servico, caminho_ficheiro, pasta_id):
    nome = os.path.basename(caminho_ficheiro)
    metadados = {"name": nome, "parents": [pasta_id]}
    media = MediaFileUpload(caminho_ficheiro, mimetype="application/gzip", resumable=True)
    ficheiro = servico.files().create(body=metadados, media_body=media, fields="id,name").execute()
    print(f"Backup enviado: {ficheiro['name']} (id {ficheiro['id']})")


def apagar_backups_antigos(servico, pasta_id):
    limite = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=DIAS_A_MANTER)
    query = f"'{pasta_id}' in parents and trashed = false"
    resultado = servico.files().list(q=query, fields="files(id,name,createdTime)").execute()
    for entrada in resultado.get("files", []):
        nome = entrada["name"]
        if not (nome.startswith(PREFIXO) and nome.endswith(".sql.gz")):
            continue
        criado_em = datetime.datetime.fromisoformat(entrada["createdTime"].replace("Z", "+00:00"))
        if criado_em < limite:
            servico.files().delete(fileId=entrada["id"]).execute()
            print(f"Backup antigo apagado: {nome}")


def main():
    if len(sys.argv) != 2:
        print("Uso: python3 enviar_backup_drive.py <caminho-do-ficheiro>", file=sys.stderr)
        sys.exit(1)

    caminho_ficheiro = sys.argv[1]
    pasta_id = os.environ["GDRIVE_FOLDER_ID"]

    servico = obter_servico()
    enviar(servico, caminho_ficheiro, pasta_id)
    apagar_backups_antigos(servico, pasta_id)


if __name__ == "__main__":
    main()
