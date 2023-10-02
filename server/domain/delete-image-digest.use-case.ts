import { RegistryApiRepository } from '../gateways/registry-api.gateway'

export class DeleteImageDigestUseCase {
  constructor (private repository: RegistryApiRepository) {}

  execute (port: { tag: string, repositoryName: string }): Promise<boolean> {
    return this.repository.deleteImageDigest(port.repositoryName, port.tag)
  }
}
