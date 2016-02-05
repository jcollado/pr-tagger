import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import test from 'ava'

chai.use(chaiAsPromised)
const expect = chai.expect

const util = require('../../../src/github/util')

test('github.util.getSemverComments: filters semver comments', () => {
  const commentList = [
    {body: 'a comment'},
    {body: 'v0.0.0'},
    {body: 'v0.1.0'},
    {body: 'another comment'},
    {body: 'semver v0.2.0 embedded in a comment'},
    {body: 'Released in: [v0.3.0](https://github.com/user/project/releases/tag/v0.3.0)'}
  ]

  expect(util.getSemverComments(commentList))
    .to.deep.equal([
      'v0.0.0',
      'v0.1.0',
      'semver v0.2.0 embedded in a comment',
      'Released in: [v0.3.0](https://github.com/user/project/releases/tag/v0.3.0)'
    ])
})

test('github.util.getSemverComments: returns empty array on no comments', () => {
  const commentList = []
  expect(util.getSemverComments(commentList))
    .to.deep.equal([])
})
