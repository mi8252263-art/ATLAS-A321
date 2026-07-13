import { describe, expect, it } from 'vitest'
import { parseIncentiveSheets } from './incentiveParser'

describe('parseIncentiveSheets', () => {
  it('parses conditional and unconditional incentive rows from sheet data', () => {
    const sheets = {
      'INSENTIF BERSYARAT': [
        ['NIK', 'Nama', 'Jumlah Insentif Toko', 'Status', 'Insentif Challenge Juli', 'Status'],
        ['191924', 'Muhammad Ihsar', '1000000', 'Terpenuhi', '500000', 'Terpenuhi'],
        ['187856', 'MONICA', '750000', 'Belum Terpenuhi', '250000', 'Belum Terpenuhi'],
      ],
      'INSENTIF TANPA SYARAT': [
        ['NIK', 'Nama', 'Insentif Produk / kategori', 'Bonus', 'Keterangan'],
        ['191924', 'Muhammad Ihsar', 'Produk A', '250000', 'Lunas'],
        ['187856', 'MONICA', 'Produk B', '150000', 'Lunas'],
      ],
      'SKU INSENTIF': [
        ['SKU / artikel', 'Nama produk / deskripsi', 'Syarat', 'Insentif value'],
        ['SKU-1', 'Produk A', '>10', '500000'],
        ['SKU-2', 'Produk B', '>5', '300000'],
      ],
    }

    const result = parseIncentiveSheets(sheets)

    expect(result.conditional.rows).toHaveLength(2)
    expect(result.conditional.rows[0]).toMatchObject({ nik: '191924', nama: 'Muhammad Ihsar', tokoValue: 1000000, status: 'Terpenuhi', challengeValue: 500000 })
    expect(result.unconditional.rows).toHaveLength(2)
    expect(result.unconditional.rows[0]).toMatchObject({ nik: '191924', nama: 'Muhammad Ihsar', category: 'Produk A', value: 250000 })
    expect(result.unconditional.rows[0].items).toEqual([{ label: 'Bonus', amount: 250000 }])
    expect(result.unconditional.rows[1].items).toEqual([{ label: 'Bonus', amount: 150000 }])
    expect(result.sku.rows).toHaveLength(2)
    expect(result.sku.rows[0]).toMatchObject({ sku: 'SKU-1', name: 'Produk A', requirement: '>10', incentiveValue: 500000 })
  })
})
