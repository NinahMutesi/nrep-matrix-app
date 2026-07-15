In src/app/matrix/[targetId]/page.tsx, find the MultiRaterScore component call and add resultCode prop:

FIND:
  <MultiRaterScore
    targetId={target.$id}
    target={target}
    scoreUser={(target as any).scoreUser ?? null}
    scoreAdmin={(target as any).scoreAdmin ?? null}
    profile={profile}
    onUpdated={load}
  />

REPLACE WITH:
  <MultiRaterScore
    targetId={target.$id}
    target={{ ...target, resultCode: result?.code }}
    scoreUser={(target as any).scoreUser ?? null}
    scoreAdmin={(target as any).scoreAdmin ?? null}
    profile={profile}
    onUpdated={load}
  />
