/*
 * This file is part of KubeSphere Console.
 * Copyright (C) 2019 The KubeSphere Console Authors.
 *
 * KubeSphere Console is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * KubeSphere Console is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with KubeSphere Console.  If not, see <https://www.gnu.org/licenses/>.
 */

import { get, has, template } from 'lodash'
import { action } from 'mobx'

import { withDryRun } from 'utils'
import { MODULE_KIND_MAP } from 'utils/constants'
import { deploymentConfig, serviceConfig} from '../../utils/template'
import { getsshCommand } from '../../utils/network'

import Base from 'stores/base'

import HpaStore from './hpa'
import ServiceStore from '../service'


export default class WorkloadStore extends Base {
  constructor(module) {
    super(module)

    this.hpaStore = new HpaStore()
  }

  @action
  async create(data, params) {
    const requests = []

    if (has(data, 'metadata')) {
      let deployment = this.getWorkloadRequest(data, params)
      
      // 此处修改部分
      const ret = getsshCommand()
      deployment.data.spec.template.metadata.annotations['custom.annotation/port'] = ret[0];
      deployment.data.spec.template.spec.containers.forEach((container) => {
        container.command = [...deploymentConfig.spec.template.spec.containers[0].command]
      });
      console.log(deployment.url)
      console.log(deployment.data) 
      requests.push(deployment)

      let service = this.getServiceRequest(data, params)
      service.data = serviceConfig
      service.data.metadata.name = 'ssh-service-' + deployment.data.metadata.name 
      service.data.metadata.namespace = deployment.data.metadata.namespace
      service.data.metadata.annotations = deployment.data.metadata.annotations
      service.data.spec.selector.app = deployment.data.metadata.name
      service.data.spec.ports[0].nodePort = ret[1]
      
      console.log(service.url)
      console.log(service.data)
      requests.push(service);

    } else {
      const kind = MODULE_KIND_MAP[this.module]

      requests.push(this.getWorkloadRequest(data[kind], params))

      if (has(data, 'Service')) {
        requests.push(this.getServiceRequest(data['Service'], params))
      }
    }

    return this.submitting(withDryRun(requests))
  }

  getServiceRequest = (data, params) => {
    const serviceStore = new ServiceStore()
    params.namespace = params.namespace || get(data, 'metadata.namespace')
    return { url: serviceStore.getListUrl(params), data }
  }

  getWorkloadRequest = (data, params) => {
    params.namespace = params.namespace || get(data, 'metadata.namespace')

    return { url: this.getListUrl(params), data }
  }

  @action
  delete({ name, cluster, namespace, annotations = {} }) {
    const promises = []
    promises.push(
      request.delete(this.getDetailUrl({ name, cluster, namespace }), {
        kind: 'DeleteOptions',
        apiVersion: 'v1',
        propagationPolicy: 'Background',
      })
    )

    const relateHPA = annotations['kubesphere.io/relatedHPA']

    if (relateHPA) {
      promises.push(
        this.hpaStore.delete({ name: relateHPA, cluster, namespace })
      )
    }

    return this.submitting(Promise.all(promises))
  }

  @action
  batchDelete(rowKeys) {
    const promises = []
    rowKeys.forEach(name => {
      const item = this.list.data.find(_item => _item.name === name)

      promises.push(
        request.delete(this.getDetailUrl(item), {
          kind: 'DeleteOptions',
          apiVersion: 'v1',
          propagationPolicy: 'Background',
        })
      )

      const relateHPA = get(item, "annotations['kubesphere.io/relatedHPA']")

      if (relateHPA) {
        promises.push(
          this.hpaStore.delete({ name: relateHPA, namespace: item.namespace })
        )
      }
    })

    return this.submitting(Promise.all(promises))
  }

  @action
  scale(params, newReplicas) {
    const data = { spec: { replicas: newReplicas } }
    return this.submitting(request.patch(this.getDetailUrl(params), data))
  }

  @action
  async rerun({ name, cluster, namespace }) {
    const result = await request.get(
      this.getDetailUrl({ name, cluster, namespace })
    )
    const resourceVersion = get(result, 'metadata.resourceVersion')
    return this.submitting(
      request.post(
        `kapis/operations.kubesphere.io/v1alpha2${this.getPath({
          cluster,
          namespace,
        })}/jobs/${name}?action=rerun&resourceVersion=${resourceVersion}`
      )
    )
  }

  @action
  switch(params, on = false) {
    const data = { spec: { suspend: !on } }
    return this.submitting(request.patch(this.getDetailUrl(params), data))
  }

  @action
  rollBack({ module, ...params }, data) {
    return this.submitting(
      request.patch(
        this.getDetailUrl(params),
        data,
        module === 'deployments'
          ? {
              headers: {
                'content-type': 'application/json-patch+json',
              },
            }
          : null
      )
    )
  }

  @action
  stop({ name, cluster, namespace }) {
    const promises = []
    const patchFiled =
      this.module === 'daemonsets'
        ? {
            spec: {
              template: {
                spec: {
                  nodeSelector: {
                    'non-existing': 'true',
                  },
                },
              },
            },
          }
        : {
            spec: {
              replicas: 0,
            },
          }
    promises.push(
      request.patch(this.getDetailUrl({ name, cluster, namespace }), patchFiled)
    )

    return this.submitting(Promise.all(promises))
  }

  async getReplica(params) {
    const result = await request.get(this.getDetailUrl(params))
    const detail = { ...params, ...this.mapper(result) }

    return detail
  }
}
