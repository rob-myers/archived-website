import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import classNames from 'classnames';
import { LevelState } from '@model/level/level.model';
import { LevelMeta, metaPointRadius } from '@model/level/level-meta.model';
import { subscribeToWorker } from '@model/level/level.worker.model';
import { Act } from '@store/level.duck';
import css from './level.scss';

type MetaLookup = LevelState['metas'];

const LevelMetas: React.FC<Props> = ({ levelUid, overlayRef }) => {
  const worker = useSelector(({ level: { worker } }) => worker)!;
  const metaUi = useSelector(({ level: { instance } }) => instance[levelUid]?.metaUi);
  const draggedMeta = useSelector(({ level: { instance: { [levelUid]: level } } }) =>
    level.draggedMeta ? level.metaUi[level.draggedMeta] : null);
  const mouseWorld = useSelector(({ level: { instance } }) =>
    draggedMeta && instance[levelUid]?.mouseWorld);
  const wheelFowarder = useSelector(({ level: { instance } }) =>
    instance[levelUid].wheelForwarder);

  const [levelMetas, setLevelMetas] = useState<MetaLookup>({});
  const dispatch = useDispatch();

  useEffect(() => {
    const sub = subscribeToWorker(worker, (msg) => {
      if (msg.key === 'send-level-metas' && msg.levelUid === levelUid) {
        const metas = msg.metas.map(p => LevelMeta.fromJson(p))
          .reduce<MetaLookup>((agg, item) => ({ ...agg, [item.key]: item }), {}); 
        setLevelMetas(metas);
        dispatch(Act.syncMetaUi(levelUid, Object.values(metas)));
      }
    });
    worker.postMessage({ key: 'request-level-metas', levelUid });
    return () => sub.unsubscribe();
  }, []);

  const addTag = (metaKey: string, tag: string) => {
    if (/^[a-z0-9-]+$/.test(tag)) {
      if (tag === '-') {
        worker.postMessage({ key: 'remove-level-meta', levelUid, metaKey });
      } else {
        worker.postMessage({ key: 'update-level-meta', levelUid, metaKey, update: { key: 'add-tag', tag }});
        return true;
      }
    }
  };
  const removeTag = (metaKey: string, tag: string) =>
    worker.postMessage({ key: 'update-level-meta', levelUid, metaKey, update: { key: 'remove-tag', tag }});
  const closeMeta = (metaKey: string) =>
    dispatch(Act.updateMetaUi(levelUid, metaKey, { open: false }));

  return (
    <>
      <g className={css.metas}>
        {draggedMeta && mouseWorld &&
          <g className={css.dragIndicator}>
            <line
              x1={draggedMeta.position.x}
              y1={draggedMeta.position.y}
              x2={mouseWorld.x}
              y2={mouseWorld.y}
            />
            <circle cx={mouseWorld.x} cy={mouseWorld.y} r={1}/>
          </g>
        }
        {// Metas
          Object.values(levelMetas).map(({ position, key, light }) =>
            <g key={key}>
              <circle
                cx={position.x}
                cy={position.y}
                r={metaPointRadius}
              />
              {light && (
                <>
                  <defs>
                    <radialGradient
                      id={`light-radial-${key}`}
                      cx={`${100 * light.sourceRatios.x}%`}
                      cy={`${100 * light.sourceRatios.y}%`}
                      r="50%"
                    >
                      <stop offset="0%" style={{ stopColor: 'rgba(0, 0, 0, 0.1' }} />
                      {/* <stop offset="100%" style={{ stopColor: 'rgba(0, 0, 0, 0.1)' }} /> */}
                      {/* <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.25)' }} />
                      <stop offset="50%" style={{ stopColor: 'rgba(255, 255, 255, 0.1)' }} />
                      <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0)' }} /> */}
                    </radialGradient>
                  </defs>
                  <path
                    key={`light-${key}`}
                    strokeWidth={0}
                    d={light.polygon.svgPath}
                    fill={`url(#light-radial-${key})`}
                  />
                </>
              )}
            </g>
          )}
      </g>
      {// Popovers
        overlayRef.current && (
          ReactDOM.createPortal(
            Object.values(levelMetas).map(({ key, tags }) => (
              metaUi[key] && (
                <section
                  key={key}
                  className={classNames(css.metaPopover, {
                    [css.open]: metaUi[key].open && key !== draggedMeta?.key,
                  })}
                  style={{
                    left: metaUi[key].dialogPosition.x,
                    top: metaUi[key].dialogPosition.y,
                  }}
                  onWheel={(e) => {
                    /**
                     * Forward wheel events to LevelMouse,
                     * so can pan/zoom over popover.
                     */
                    wheelFowarder?.next({ key: 'wheel', e });
                  }}
                >
                  <section className={css.content}>
                    <input
                      placeholder="tag"
                      onKeyPress={({ key: inputKey, currentTarget, currentTarget: { value } }) =>
                        inputKey === 'Enter' && addTag(key, value) && (currentTarget.value = '')
                      }
                      onKeyDown={({ key: inputKey }) => inputKey === 'Escape' && closeMeta(key)}
                    />
                    <section className={css.tags}>
                      {tags.map((tag) =>
                        <div
                          key={tag}
                          className={css.tag}
                          onClick={() => removeTag(key, tag)}
                        >
                          {tag}
                        </div>
                      )}
                    </section>
                  </section>
                </section>
              )
              
            ))
            , overlayRef.current
          )
        )
      }
    </>
  );
};

interface Props {
  levelUid: string;
  overlayRef: React.RefObject<HTMLElement>;
}

export default LevelMetas;
