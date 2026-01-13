import type { APIContext } from "astro";
import { InvitationService } from "@/services/InvitationService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { handleApiRequest } from "@/lib/http/apiHelpers";
import {
  familyIdParamPathSchema,
  createInvitationCommandSchema,
  listInvitationsQuerySchema,
  type FamilyIdParamPath,
  type CreateInvitationCommand,
  type ListInvitationsQuery,
} from "@/types";

export const prerender = false;

export async function GET({ params, url, locals }: APIContext): Promise<Response> {
  return handleApiRequest<FamilyIdParamPath, ListInvitationsQuery>({
    handler: async ({ userId, path, query, locals }) => {
      const invitationService = new InvitationService(
        locals.repositories.invitation,
        locals.repositories.family,
        locals.repositories.user,
        locals.repositories.log
      );

      const result = await invitationService.listInvitations(path.familyId, userId, query?.status);

      return mapResultToResponse(result);
    },
    context: "GET /api/families/[familyId]/invitations",
    pathSchema: familyIdParamPathSchema,
    querySchema: listInvitationsQuerySchema,
    params,
    url,
    locals,
  });
}

export async function POST({ params, request, locals }: APIContext): Promise<Response> {
  return handleApiRequest<FamilyIdParamPath, unknown, CreateInvitationCommand>({
    handler: async ({ userId, path, body, locals }) => {
      const invitationService = new InvitationService(
        locals.repositories.invitation,
        locals.repositories.family,
        locals.repositories.user,
        locals.repositories.log
      );

      const result = await invitationService.createInvitation(path.familyId, body, userId);

      return mapResultToResponse(result, { successStatus: 201 });
    },
    context: "POST /api/families/[familyId]/invitations",
    pathSchema: familyIdParamPathSchema,
    bodySchema: createInvitationCommandSchema,
    params,
    request,
    locals,
  });
}
