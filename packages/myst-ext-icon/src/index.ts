import type { RoleSpec, RoleData, GenericNode } from 'myst-common';

export const iconRole: RoleSpec = {
  name: 'fas',
  alias: ['fab', 'far'],
  body: {
    type: String,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    const name = data.body as string;
    const kind = data.name as string;
    const icon = {
      type: 'icon',
      kind,
      name,
    };
    return [icon];
  },
};
