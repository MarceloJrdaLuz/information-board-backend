import { OrderedPublisher } from "./organizePublishersByFamily";

export function generateFirstNameDisplay(publishers: OrderedPublisher[]): (OrderedPublisher & { displayName: string })[] {
    // Cria um array de todos os primeiros nomes de cada publisher, considerando nickname se existir
    const firstNamesAll = publishers.map(pub => {
        const baseName = pub.nickname?.trim() || pub.fullName.trim();
        return baseName.split(" ")[0];
    });

    return publishers.map(pub => {
        const baseName = pub.nickname?.trim() || pub.fullName.trim();
        const firstName = baseName.split(" ")[0];

        // Se houver outro publisher com o mesmo primeiro nome, exibe o nome completo
        const duplicate = firstNamesAll.filter(fn => fn === firstName).length > 1;

        return {
            ...pub,
            displayName: duplicate ? baseName : firstName
        };
    });
}
