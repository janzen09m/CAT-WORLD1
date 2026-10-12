import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CAT_SKINS, GET_CAT_BY_ID } from '../src/data/catsData.js';
import { CHESTS_CONFIG, KEY_EXCHANGE_RATES } from '../src/data/chestsData.js';
import { Chess } from 'chess.js';

describe('CAT WORLD - Game Mechanics & Economics Tests', () => {
  it('should have at least 50 unique cat skins defined', () => {
    assert.ok(CAT_SKINS.length >= 50, `Expected at least 50 skins, found ${CAT_SKINS.length}`);

    // Check unique IDs
    const idSet = new Set(CAT_SKINS.map(c => c.id));
    assert.strictEqual(idSet.size, CAT_SKINS.length, 'All cat skin IDs must be unique');

    // Check starter cat
    const starterCat = GET_CAT_BY_ID('cat-01');
    assert.strictEqual(starterCat.name, 'Weiße Katze');
    assert.strictEqual(starterCat.rarity, 'common');
  });

  it('should ensure all chest drop probabilities sum up to exactly 100%', () => {
    for (const chest of CHESTS_CONFIG) {
      const sum =
        chest.dropRates.common +
        chest.dropRates.uncommon +
        chest.dropRates.rare +
        chest.dropRates.epic +
        chest.dropRates.legendary +
        chest.dropRates.mythic;

      assert.strictEqual(sum, 100, `Chest ${chest.id} drop rates must sum to 100%, got ${sum}`);
    }
  });

  it('should correctly calculate key to star shard conversion rates', () => {
    assert.strictEqual(KEY_EXCHANGE_RATES.wooden.shardsPerKey, 10);
    assert.strictEqual(KEY_EXCHANGE_RATES.blue.shardsPerKey, 40);
    assert.strictEqual(KEY_EXCHANGE_RATES.epic.shardsPerKey, 160);
    assert.strictEqual(KEY_EXCHANGE_RATES.legendary.shardsPerKey, 550);

    // Multi-key conversion calculation
    const qty = 3;
    const earned = qty * KEY_EXCHANGE_RATES.blue.shardsPerKey;
    assert.strictEqual(earned, 120);
  });

  it('should properly execute chess moves and detect check using chess.js', () => {
    const chess = new Chess();
    assert.strictEqual(chess.turn(), 'w');

    // 1. e4 e5
    const move1 = chess.move('e4');
    assert.ok(move1);
    const move2 = chess.move('e5');
    assert.ok(move2);

    // Scholar's Mate test
    chess.move('Bc4');
    chess.move('Nc6');
    chess.move('Qh5');
    chess.move('Nf6');
    const mateMove = chess.move('Qxf7#');

    assert.ok(mateMove);
    assert.strictEqual(chess.isCheckmate(), true, 'Game must recognize checkmate');
    assert.strictEqual(chess.isGameOver(), true, 'Game must recognize game over');
  });

  it('should ensure the completely golden cat is the most expensive cat in the game', () => {
    const goldCat = GET_CAT_BY_ID('cat-53');
    assert.ok(goldCat, 'cat-53 must exist');
    assert.strictEqual(goldCat.name, 'Komplett Goldene Katze Midas');
    assert.strictEqual(goldCat.rarity, 'mythic');
    assert.strictEqual(goldCat.specialTrait, 'pure-gold');

    // Verify it is strictly more expensive than all other cats
    for (const otherCat of CAT_SKINS) {
      if (otherCat.id !== 'cat-53') {
        assert.ok(
          goldCat.price > otherCat.price,
          `Gold cat price (${goldCat.price}) must be higher than ${otherCat.name} (${otherCat.price})`
        );
      }
    }
  });
});
