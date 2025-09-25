import { AppDataSource } from "../data-source";
import { Publisher } from "../entities/Publisher";

export const publisherRepository = AppDataSource.getRepository(Publisher)

export async function findPublisherWithPrivilege(id: string, privilege: string) {
  const publisher = await publisherRepository.findOne({
    where: { id },
    relations: ["privilegesRelation", "privilegesRelation.privilege", "congregation"],
  });

  if (!publisher) return null;

  const hasPrivilege = publisher.privilegesRelation?.some(pp => pp.privilege.name === privilege);
  return hasPrivilege ? publisher : null;
}
