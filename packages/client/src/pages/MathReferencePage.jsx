function MathReferencePage() {
  return (
    <div className="container">
      <h1>Math reference</h1>
      <p className="unit-meta" style={{ marginBottom: 14 }}>
        A plain-language reference for every formula used to compute a
        mech&apos;s stats on the roster card.
      </p>

      <div className="card">
        <h2 style={{ fontSize: 15, marginTop: 0 }}>Total weight</h2>
        <p className="unit-stats" style={{ fontSize: 13 }}>
          Total weight = unit base weight + the weight of every equipped item
          (Left, Right, Movement, Head) + carried mech weight (drop pods only).
        </p>
        <p className="unit-stats" style={{ fontSize: 13 }}>
          Movement and Augment equipment weigh 0t by default, so most of a
          mech&apos;s weight comes from its base weight and its weapons.
        </p>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, marginTop: 0 }}>Weapon slot capacity</h2>
        <p className="unit-stats" style={{ fontSize: 13 }}>
          Each weapon has a size that determines how many slots it takes up in a
          Left, Right, or Head slot bank:
        </p>
        <table style={{ marginTop: 8 }}>
          <thead>
            <tr>
              <th>Size</th>
              <th>Slots used</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Small</td>
              <td>1</td>
            </tr>
            <tr>
              <td>Medium</td>
              <td>2</td>
            </tr>
            <tr>
              <td>Large</td>
              <td>3</td>
            </tr>
          </tbody>
        </table>
        <p className="unit-stats" style={{ fontSize: 13, marginTop: 8 }}>
          A weapon can only be equipped if its slot cost fits within the
          remaining capacity of that slot bank — options that don&apos;t fit
          show as struck-through and can&apos;t be selected. Augmentation chips
          always cost 1 slot and can only go in the Head slot.
        </p>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, marginTop: 0 }}>
          Slot bank capacity (Left / Right / Head)
        </h2>
        <p className="unit-stats" style={{ fontSize: 13 }}>
          Slot capacity = the mech&apos;s base slot count for that bank + any
          structured Left/Right/Head-slot bonuses from currently equipped items
          (e.g. an augment chip that grants &quot;+1 Right slots, −1 Left
          slots&quot;).
        </p>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, marginTop: 0 }}>Movement</h2>
        <p className="unit-stats" style={{ fontSize: 13 }}>
          Movement equipment (Legs, Chicken Legs, Quad Legs, etc.) each carry
          their own flat &quot;movement&quot; stat — it no longer scales with
          the mech&apos;s size.
        </p>
        <p className="unit-stats" style={{ fontSize: 13, marginTop: 8 }}>
          <b>Effective movement</b> = the equipped movement gear&apos;s movement
          stat + any structured &quot;Movement&quot; effect bonuses from other
          equipped items − any weight over the mech&apos;s max drop weight,
          floored at 0.
        </p>
        <p className="unit-stats" style={{ fontSize: 13, marginTop: 8 }}>
          Example: a mech equipped with Chicken Legs (7 movement) weighing 2t
          more than its max drop weight has an effective movement of 7 − 2 = 5.
        </p>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, marginTop: 0 }}>Effective HP</h2>
        <p className="unit-stats" style={{ fontSize: 13 }}>
          Effective HP = the mech&apos;s base HP + any structured &quot;HP&quot;
          effect bonuses from currently equipped items.
        </p>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, marginTop: 0 }}>Structured stat effects</h2>
        <p className="unit-stats" style={{ fontSize: 13 }}>
          Equipment can carry structured stat effects — a stat and a signed
          number, e.g. &quot;+2 Movement&quot; — which are added up across every
          currently equipped item (all slots, including Movement and Head) and
          applied to the mech&apos;s stats. The stats that can be adjusted this
          way are:
        </p>
        <ul
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            margin: '8px 0 0',
            paddingLeft: 20,
          }}
        >
          <li>Movement</li>
          <li>HP</li>
          <li>Left slots</li>
          <li>Right slots</li>
          <li>Head slots</li>
        </ul>
        <p className="unit-stats" style={{ fontSize: 13, marginTop: 8 }}>
          Equipment can also carry a plain-text effects description for anything
          that isn&apos;t a simple stat adjustment (e.g. &quot;+1 to attack
          rolls&quot;); those are narrative only and aren&apos;t included in any
          calculation.
        </p>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, marginTop: 0 }}>Weight warnings</h2>
        <p className="unit-stats" style={{ fontSize: 13 }}>
          <span className="warning-icon warning-icon-drop">⚠️</span> Orange
          warning — total weight exceeds the mech&apos;s max drop weight (but
          not its max weight). This also reduces effective movement (see above).
        </p>
        <p className="unit-stats" style={{ fontSize: 13, marginTop: 8 }}>
          <span className="warning-icon warning-icon-max">⛔</span> Red alert
          and red card border — total weight exceeds the mech&apos;s max weight
          entirely.
        </p>
      </div>
    </div>
  );
}

export default MathReferencePage;
