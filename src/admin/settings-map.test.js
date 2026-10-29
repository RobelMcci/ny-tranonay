import { describe, expect, it } from 'vitest'
import seed from '../data/content.seed.json'
import {
  formFromSettings,
  settingsFromForm,
  settingsFromRow,
  settingsToRow,
  validateSettings,
} from './settings-map.js'

const clone = () => structuredClone(seed.settings)

describe('settingsFromRow / settingsToRow', () => {
  it('fait l’aller-retour sur les réglages du seed', () => {
    expect(settingsFromRow(settingsToRow(seed.settings))).toEqual(seed.settings)
  })

  it('renvoie null pour une ligne absente', () => {
    expect(settingsFromRow(null)).toBeNull()
    expect(settingsFromRow(undefined)).toBeNull()
  })

  it('ignore les colonnes en trop et ajoute id: 1 à l’écriture', () => {
    const row = { ...settingsToRow(seed.settings), extra_column: 'x' }
    expect(settingsFromRow(row)).toEqual(seed.settings)
    expect(settingsToRow(seed.settings)).toMatchObject({ id: 1, whatsapp_number: '261342141031', postal_code: '101' })
    expect(Object.keys(settingsToRow(seed.settings))).not.toContain('whatsappNumber')
  })
})

describe('formFromSettings / settingsFromForm', () => {
  it('convertit en texte puis revient aux types du contrat', () => {
    const form = formFromSettings(seed.settings)
    expect(form.latitude).toBe('-18.945199')
    expect(form.openHour).toBe('8')
    expect(settingsFromForm(form)).toEqual(seed.settings)
  })

  it('donne des champs vides quand il n’y a pas encore de réglages', () => {
    const form = formFromSettings(null)
    expect(form.name).toBe('')
    expect(form.latitude).toBe('')
  })

  it('conserve tel quel le texte de sécurité stocké (non modifiable depuis le formulaire)', () => {
    const stored = { ...seed.settings, securitySummary: '  Texte stocké, espaces compris.\n' }
    const row = settingsToRow(settingsFromForm(formFromSettings(settingsFromRow(settingsToRow(stored)))))
    expect(row.security_summary).toBe(stored.securitySummary)
    expect(settingsFromForm(formFromSettings(seed.settings)).securitySummary).toBe(seed.settings.securitySummary)
  })

  it('accepte une virgule décimale et retire les espaces autour', () => {
    const form = { ...formFromSettings(seed.settings), latitude: '-18,945199', name: '  Tranonay ' }
    expect(settingsFromForm(form)).toMatchObject({ latitude: -18.945199, name: 'Tranonay' })
  })
})

describe('validateSettings', () => {
  it('ne signale rien pour les réglages du seed (en nombres ou en texte)', () => {
    expect(validateSettings(clone())).toEqual({})
    expect(validateSettings(formFromSettings(seed.settings))).toEqual({})
  })

  it('exige les champs obligatoires', () => {
    for (const key of ['name', 'tagline', 'phone', 'email', 'street', 'city', 'postalCode', 'country', 'hoursLabel', 'roomCheckIn', 'roomCheckOut']) {
      const errors = validateSettings({ ...clone(), [key]: '  ' })
      expect(errors[key], key).toBeTruthy()
    }
  })

  it('n’exige plus le texte de sécurité (non affiché sur le site, absent du formulaire)', () => {
    expect(validateSettings({ ...clone(), securitySummary: '' })).toEqual({})
    expect(validateSettings({ ...formFromSettings(seed.settings), securitySummary: '' })).toEqual({})
  })

  it('contrôle le numéro WhatsApp (chiffres seulement, 8 à 15)', () => {
    expect(validateSettings({ ...clone(), whatsappNumber: '+261342141031' }).whatsappNumber).toBeTruthy()
    expect(validateSettings({ ...clone(), whatsappNumber: '1234567' }).whatsappNumber).toBeTruthy()
    expect(validateSettings({ ...clone(), whatsappNumber: '1234567890123456' }).whatsappNumber).toBeTruthy()
    expect(validateSettings({ ...clone(), whatsappNumber: '12345678' }).whatsappNumber).toBeUndefined()
  })

  it('contrôle le code pays (2 lettres majuscules)', () => {
    expect(validateSettings({ ...clone(), countryCode: 'mg' }).countryCode).toBeTruthy()
    expect(validateSettings({ ...clone(), countryCode: 'MGA' }).countryCode).toBeTruthy()
    expect(validateSettings({ ...clone(), countryCode: 'FR' }).countryCode).toBeUndefined()
  })

  it('contrôle e-mail, téléphone et adresses', () => {
    const errors = validateSettings({ ...clone(), email: 'a@b', phone: '12', facebookUrl: 'facebook', messengerUrl: '' })
    expect(errors.email).toBeTruthy()
    expect(errors.phone).toBeTruthy()
    expect(errors.facebookUrl).toBeTruthy()
    expect(errors.messengerUrl).toBeTruthy()
  })

  it('exige nom et adresse du partenaire ensemble, ou aucun des deux', () => {
    expect(validateSettings({ ...clone(), securityPartnerName: '', securityPartnerUrl: '' })).toEqual({})
    expect(validateSettings({ ...clone(), securityPartnerUrl: '' }).securityPartnerUrl).toBeTruthy()
    expect(validateSettings({ ...clone(), securityPartnerName: '' }).securityPartnerName).toBeTruthy()
    expect(validateSettings({ ...clone(), securityPartnerUrl: 'dirickx' }).securityPartnerUrl).toBeTruthy()
  })

  it('contrôle les coordonnées', () => {
    expect(validateSettings({ ...clone(), latitude: '200' }).latitude).toBeTruthy()
    expect(validateSettings({ ...clone(), longitude: 'x' }).longitude).toBeTruthy()
  })

  it('contrôle les heures (0-23, ouverture avant fermeture)', () => {
    expect(validateSettings({ ...clone(), openHour: '24' }).openHour).toBeTruthy()
    expect(validateSettings({ ...clone(), closeHour: '' }).closeHour).toBeTruthy()
    expect(validateSettings({ ...clone(), openHour: '22', closeHour: '21' }).closeHour).toBeTruthy()
    expect(validateSettings({ ...clone(), openHour: '9', closeHour: '9' }).closeHour).toBeTruthy()
  })

  it('contrôle le nombre d’abonnés', () => {
    expect(validateSettings({ ...clone(), facebookFollowers: '-1' }).facebookFollowers).toBeTruthy()
    expect(validateSettings({ ...clone(), facebookFollowers: '12,5' }).facebookFollowers).toBeTruthy()
    expect(validateSettings({ ...clone(), facebookFollowers: '0' }).facebookFollowers).toBeUndefined()
  })
})
