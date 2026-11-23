-- Anexos e documentos passam a ficar no Storage (jurisflow-docs/{escritorio_id}/anexos/...).
-- A aba Documentos também recebe fotos (RG, CNH): libera JPG e PNG no bucket.
update storage.buckets
   set allowed_mime_types = array[
     'application/pdf',
     'application/msword',
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
     'application/vnd.oasis.opendocument.text',
     'application/rtf',
     'image/jpeg',
     'image/png'
   ]
 where id = 'jurisflow-docs';
