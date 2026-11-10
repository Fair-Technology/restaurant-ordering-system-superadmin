import type { PlatformLegalIdentityDto } from '../services/api';

/** The backend declares no request DTO for this PUT, so the body is derived from the response DTO. */
export type PlatformLegalIdentityUpdateBody = Omit<PlatformLegalIdentityDto, 'updatedAt' | 'updatedBy'>;

export interface PlatformLegalFormState {
  platformName: string;
  salesSiteUrl: string;
  operatorName: string;
  operatorAddress: string;
  operatorEmail: string;
  euAppointed: boolean;
  euName: string;
  euAddress: string;
  euEmail: string;
}

export function toPlatformLegalForm(p: PlatformLegalIdentityDto): PlatformLegalFormState {
  return {
    platformName: p.platformName,
    salesSiteUrl: p.salesSiteUrl ?? '',
    operatorName: p.operator.legalName,
    operatorAddress: p.operator.address,
    operatorEmail: p.operator.email,
    euAppointed: p.euRepresentative !== null,
    euName: p.euRepresentative?.name ?? '',
    euAddress: p.euRepresentative?.address ?? '',
    euEmail: p.euRepresentative?.email ?? '',
  };
}

export function toPlatformLegalBody(f: PlatformLegalFormState): PlatformLegalIdentityUpdateBody {
  return {
    platformName: f.platformName.trim(),
    salesSiteUrl: f.salesSiteUrl.trim() === '' ? null : f.salesSiteUrl.trim(),
    operator: {
      legalName: f.operatorName.trim(),
      address: f.operatorAddress.trim(),
      email: f.operatorEmail.trim(),
    },
    euRepresentative: f.euAppointed
      ? { name: f.euName.trim(), address: f.euAddress.trim(), email: f.euEmail.trim() }
      : null,
  };
}
