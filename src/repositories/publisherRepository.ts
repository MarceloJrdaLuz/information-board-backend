import { AppDataSource } from "../data-source";
import { Publisher } from "../entities/Publisher";
import { PrivilegeCode } from "../types/privileges";
import { hasPrivilege } from "../helpers/publisherPrivilegeHelper";

export const publisherRepository = AppDataSource.getRepository(Publisher)

export async function findPublisherWithPrivilege(id: string, privilege: PrivilegeCode | string) {
  const publisher = await publisherRepository.findOne({
    where: { id },
    relations: ["privilegesRelation", "privilegesRelation.privilege", "congregation"],
  });

  if (!publisher) return null;

  if (Object.values(PrivilegeCode).includes(privilege as PrivilegeCode)) {
    const isGranted = hasPrivilege(publisher, privilege as PrivilegeCode);
    return isGranted ? publisher : null;
  }

  const hasRel = publisher.privilegesRelation?.some(
    pp => pp.privilege?.name === privilege || pp.privilege?.code === privilege
  );
  return hasRel ? publisher : null;
}

