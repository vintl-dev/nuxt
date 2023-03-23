import { basename } from 'pathe'
import type { ParserOptionsResolvingFunction } from './options.js'

export const defaultOptionsResolver: ParserOptionsResolvingFunction =
  function () {
    return {
      locale: new Intl.Locale(basename(this.moduleId).split('.')[0]),
    }
  }
