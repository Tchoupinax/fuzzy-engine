import { Option } from '@swan-io/boxed'

export type Provider = Option<'aws-ecr' | 'docker-registry-v2' | 'dockerhub' | 'github-ecr'>
