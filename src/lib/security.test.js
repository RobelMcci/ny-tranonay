import { describe, expect, it } from 'vitest'
import { securityPartner } from './security.js'

describe('securityPartner', () => {
  it('nom et adresse renseignés : le partenaire', () => {
    expect(securityPartner({ partnerName: 'Dirickx Guard', partnerUrl: 'https://dirickx.mg' })).toEqual({ name: 'Dirickx Guard', url: 'https://dirickx.mg' })
  })

  it('nom ou adresse vide : aucun partenaire (la phrase « avec le renfort de … » est masquée)', () => {
    expect(securityPartner({ partnerName: '', partnerUrl: 'https://dirickx.mg' })).toBeNull()
    expect(securityPartner({ partnerName: 'Dirickx Guard', partnerUrl: '  ' })).toBeNull()
    expect(securityPartner({ partnerName: '', partnerUrl: '' })).toBeNull()
    expect(securityPartner({})).toBeNull()
    expect(securityPartner(undefined)).toBeNull()
  })
})
