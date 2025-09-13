import { Router } from 'express';
import { create } from 'xmlbuilder2';
const r = Router();

r.get('/metadata', (_req, res) => {
  const entity = process.env.SAML_ENTITY_ID || 'https://blackroad.io/saml/metadata';
  const acs    = process.env.SAML_ASSERTION_URL || 'https://blackroad.io/saml/acs';
  const xml = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('EntityDescriptor', { entityID: entity, xmlns: 'urn:oasis:names:tc:SAML:2.0:metadata' })
      .ele('SPSSODescriptor', { AuthnRequestsSigned: 'false', WantAssertionsSigned: 'true', protocolSupportEnumeration: 'urn:oasis:names:tc:SAML:2.0:protocol' })
        .ele('AssertionConsumerService', { Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST', Location: acs, index: '0', isDefault: 'true' }).up()
      .up()
    .up()
    .end({ prettyPrint: true });
  res.type('application/samlmetadata+xml').send(xml);
});

export default r;
