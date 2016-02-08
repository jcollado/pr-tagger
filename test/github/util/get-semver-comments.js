import test from 'ava'

const util = require('../../../src/github/util')

test('github.util.getSemverComments: filters semver comments', (t) => {
  const commentList = [
    {body: 'a comment'},
    {body: 'v0.0.0'},
    {body: 'v0.1.0'},
    {body: 'another comment'},
    {body: 'semver v0.2.0 embedded in a comment'},
    {body: 'Released in: [v0.3.0](https://github.com/user/project/releases/tag/v0.3.0)'}
  ]

  t.same(
    util.getSemverComments(commentList),
    [
      'v0.0.0',
      'v0.1.0',
      'semver v0.2.0 embedded in a comment',
      'Released in: [v0.3.0](https://github.com/user/project/releases/tag/v0.3.0)'
    ])
})

test('github.util.getSemverComments: returns empty array on no comments', (t) => {
  const commentList = []
  t.same(util.getSemverComments(commentList), [])
})
