export type QueuedMutation={id:string;entity_type:string;entity_id:string;operation:'upsert'|'delete';payload:string};

export function prepareSyncMutation(mutation:QueuedMutation,localRevision?:number){
  const payload=JSON.parse(mutation.payload) as Record<string,unknown>;
  if(mutation.operation==='upsert'){
    delete payload.id;
    delete payload.revision;
    delete payload.updatedAt;
    delete payload.createdAt;
  }
  return {id:mutation.id,entityType:mutation.entity_type,entityId:mutation.entity_id,operation:mutation.operation,payload,baseRevision:mutation.operation==='upsert'&&localRevision?Math.max(1,localRevision-1):undefined};
}
