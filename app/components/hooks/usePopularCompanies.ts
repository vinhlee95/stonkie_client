import { useQuery } from '@tanstack/react-query'
import { Company } from '../../CompanyList'

export const usePopularCompanies = () =>
  useQuery<Company[]>({
    queryKey: ['companies', 'popular'],
    queryFn: async () => {
      const res = await fetch('/api/companies')
      if (!res.ok) return []
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
