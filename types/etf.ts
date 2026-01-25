export type ETFHolding = {
  name: string
  weight_percent: number
}

export type ETFSectorAllocation = {
  sector: string
  weight_percent: number
}

export type ETFCountryAllocation = {
  country: string
  weight_percent: number
}

export type ETFFundamental = {
  isin: string
  ticker: string | null
  name: string
  fund_provider: string
  fund_size_billions: number | null
  ter_percent: number
  replication_method: string
  distribution_policy: string
  fund_currency: string
  domicile: string
  launch_date: string | null
  index_tracked: string
  holdings: ETFHolding[]
  sector_allocation: ETFSectorAllocation[]
  country_allocation: ETFCountryAllocation[]
  source_url: string | null
  created_at: string | null
  updated_at: string | null
}
