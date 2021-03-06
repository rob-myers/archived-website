/**
 * Files from react-redux@7.1.7/es without exports connectAdvanced and connect.
 */
import Provider from './components/Provider';
import { ReactReduxContext } from './components/Context';
import { useDispatch, createDispatchHook } from './hooks/useDispatch';
import { useSelector, createSelectorHook } from './hooks/useSelector';
import { useStore, createStoreHook } from './hooks/useStore';
import { setBatch } from './utils/batch';
import { unstable_batchedUpdates as batch } from './utils/reactBatchedUpdates';
import shallowEqual from './utils/shallowEqual';
setBatch(batch);
export { Provider, ReactReduxContext, batch, useDispatch, createDispatchHook, useSelector, createSelectorHook, useStore, createStoreHook, shallowEqual };