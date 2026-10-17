import { describe, expect, it } from 'vitest';

import { inventedTypes } from '../testing/inventedTypes';
import { realTypes } from '../testing/fixtures';
import {
  allOrderProperties,
  commonOrderObject,
  defaultTrigger,
  hasNameField,
  holdsInstance,
  isManagementOwnerType,
  nodeKindOf,
  orderSelector,
  typeName,
} from './typeIndex';

describe('what the interface derives from the type descriptions', () => {
  it('finds the element that places an order by its parameter and not by its name', () => {
    const real = [...realTypes.list].filter((type) => isManagementOwnerType(realTypes, type)).map((type) => type.id);
    const invented = [...inventedTypes.list].filter((type) => isManagementOwnerType(inventedTypes, type)).map((type) => type.id);

    expect(real).toEqual(['flow.place_order']);
    expect(invented).toEqual(['zz.launch']);
  });

  it('knows the order types a selector offers', () => {
    const selector = orderSelector(inventedTypes, inventedTypes.byId.get('zz.launch')!);

    expect(selector?.parameter.id).toBe('shape');
    expect(selector?.orderTypes.map((type) => type.id)).toEqual(['ZzOrderA', 'ZzOrderB']);
  });

  it('does not take a choice for an order selection if one of its values is not an order type', () => {
    const gate = inventedTypes.byId.get('zz.gate')!;

    expect(orderSelector(inventedTypes, gate)).toBeNull();
    expect(orderSelector(inventedTypes, inventedTypes.byId.get('Zork')!)).toBeNull();
  });

  it('chooses the trigger of a new strategy by its time unit', () => {
    expect(defaultTrigger(realTypes)?.id).toBe('trigger.candle_close');
    expect(defaultTrigger(inventedTypes)?.id).toBe('zz.pulse');
  });

  it('gives a name to elements of the flow that have properties', () => {
    expect(hasNameField(realTypes.byId.get('flow.condition'))).toBe(true);
    expect(hasNameField(realTypes.byId.get('flow.calculation'))).toBe(true);
    expect(hasNameField(realTypes.byId.get('flow.place_order'))).toBe(false);
    expect(hasNameField(realTypes.byId.get('flow.delete_order'))).toBe(false);
    expect(hasNameField(inventedTypes.byId.get('zz.gate'))).toBe(true);
    expect(hasNameField(undefined)).toBe(false);
  });

  it('knows the kind of node and whether an element holds an instance', () => {
    expect(nodeKindOf(realTypes.byId.get('trigger.tick'))).toBe('trigger');
    expect(nodeKindOf(inventedTypes.byId.get('zz.sweep'))).toBe('flow');
    expect(nodeKindOf(inventedTypes.byId.get('Zork'))).toBe('object');
    expect(nodeKindOf(inventedTypes.byId.get('Planet'))).toBe('object');
    expect(nodeKindOf(undefined)).toBe('unknown');
    expect(holdsInstance(inventedTypes.byId.get('Zork'))).toBe(true);
    expect(holdsInstance(inventedTypes.byId.get('zz.sweep'))).toBe(false);
  });

  it('names a type in the language, or by its identifier if it is not known', () => {
    expect(typeName(realTypes, 'flow.condition', 'de')).toBe('Bedingung');
    expect(typeName(realTypes, 'flow.condition', 'en')).toBe('Condition');
    expect(typeName(realTypes, 'vendor.mystery', 'en')).toBe('vendor.mystery');
  });

  it('finds the object that stands for the order by what it has in common with all order types', () => {
    expect(commonOrderObject(realTypes)?.id).toBe('Order');
    expect(allOrderProperties(realTypes).map((property) => property.id)).toEqual(
      expect.arrayContaining(['volumen', 'limitpreis', 'stop_loss', 'position']),
    );
    // No invented object has the properties of the invented order types in common.
    expect(commonOrderObject(inventedTypes)).toBeUndefined();
  });
});
