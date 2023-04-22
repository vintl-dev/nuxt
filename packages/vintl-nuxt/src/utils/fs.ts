import { readdir, stat } from 'node:fs/promises'
import { join } from 'path'

/**
 * Creates a generator that yields for each file in the directory, and files
 * within each subdirectory as long as `depth` is not less than `1`.
 *
 * The {@link depth} parameter declares the depth this generator is willing to
 * go. When visiting a subdirectory the depth will be reduced by one, therefore
 * it will eventually settle at 0, unless it was `Infinity` (which it is by
 * default!).
 *
 * For example, assuming you provide a depth of `1`, you will get the following
 * results for our example directory path `animal_pictures`:
 *
 * - `cats` - visited, `depth` > 0
 *
 *   - `other_cats` - ignored, `depth` is 0 at this level
 *
 *       - `cheetah1.jpg` - not yielded: parent is never visited
 *   - `cat1.jpg` - yielded as `cats/cat1.jpg`
 *   - `cat2.jpg` - yielded as `cats/cat2.jpg`
 * - `dogs` - visited, `depth` > 0
 *
 *   - `dog1.jpg` - yielded as `dogs/dog1.jpg`
 *
 * Path separator matches the system one.
 *
 * This function has no recursion prevention in place, any directory link will
 * be visited and if it leads to the current directory, it will also return. One
 * way to prevent that would be to store all visited files, which is not done
 * here for the simplicity, but since it's a generator, you can always use
 * `break` to exit the loop, or throw an error, if you have to.
 *
 * @param directoryPath Path of the directory which file names to yield.
 * @param depth The depth of the walk.
 * @returns A generator which yields names of files in the directory and
 *   subdirectories as long as the depth allows.
 */
export async function* filesWithin(
  directoryPath: string,
  depth = Infinity,
): AsyncGenerator<string, void, boolean | undefined> {
  for (const entry of await readdir(directoryPath)) {
    const entryPath = join(directoryPath, entry)

    const stats = await stat(entryPath)

    if (stats.isDirectory()) {
      if (depth > 0) {
        for await (const subentry of filesWithin(entryPath, depth - 1)) {
          yield join(entry, subentry)
        }
      } else {
        continue
      }
    }

    const yieldResult = yield entry

    if (yieldResult != null && yieldResult) break
  }
}
