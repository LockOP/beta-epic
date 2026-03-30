import type { ComponentType } from '../types';
import * as uiComponents from '../../components/ui';
import * as iconComponents from '../../components/icons';

const { cn: _cn, useCarousel: _useCarousel, ...dslComponents } = uiComponents;

/**
 * Default component registry.
 *
 * All components exported from the UI barrel are available to the DSL by
 * default. Pass additional components via GuiProvider:
 *
 *   <GuiProvider components={{ MyCard, MyTable }}>
 */
export const defaultComponentRegistry: Record<string, ComponentType> =
  {
    ...(dslComponents as unknown as Record<string, ComponentType>),
    ...(iconComponents as unknown as Record<string, ComponentType>),
  };
