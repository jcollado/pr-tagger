import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import requireInject from 'require-inject'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import 'sinon-as-promised'
import test from 'ava'

chai.use(chaiAsPromised)
chai.use(sinonChai)
const expect = chai.expect

const authData = {}
const prs = [1, 2, 3, 4]
const comment = 'some semver tag used as comment'

test.beforeEach((t) => {
  const logger = {
    info: sinon.spy(),
    warn: sinon.spy(),
    error: sinon.spy()
  }
  const getSemverComments = sinon.stub()
  const writeComment = sinon.stub()
  const listComments = sinon.stub()
  const stubs = {
    ghissues: {
      listComments
    },
    [require.resolve('../../../src/logging')]: { logger },
    [require.resolve('../../../src/github/util')]: {
      getSemverComments,
      writeComment
    }
  }
  const github = requireInject('../../../src/github', stubs)

  const program = {
    user: 'some user',
    project: 'some project'
  }

  t.context = {
    getSemverComments,
    github,
    listComments,
    logger,
    program,
    writeComment
  }
})

test('github.writeComments: gets comments for each PR', (t) => {
  const { getSemverComments, github, listComments, program } = t.context
  listComments.yields(null, ['some comment', 'another comment'])
  getSemverComments.returns([])

  program.dryRun = true
  return expect(github.writeComments(authData, program, prs, comment))
    .to.be.fulfilled.then((commentList) => {
      prs.forEach((pr) => {
        expect(listComments).to.have.been.calledWith(
          authData, program.owner, program.project, pr)
      })
    })
})

test('github.writeComments: logs errors when retrieving comments', (t) => {
  const { github, listComments, logger, program } = t.context
  const error = 'some error'
  listComments.yields(error)

  program.dryRun = true
  return expect(github.writeComments(authData, program, prs, comment))
    .to.be.fulfilled.then((commentList) => {
      commentList.forEach((comment) => {
        expect(comment).to.be.null
      })
      prs.forEach((pr) => {
        expect(logger.error).to.have.been.calledWith(
          'Error checking PR#%d comments: %s', pr, error)
      })
    })
})

test('github.writeComments: writes comments if dryRun is not set', (t) => {
  const { getSemverComments, github, listComments, program, writeComment } = t.context
  listComments.yields(null, ['some comment', 'another comment'])
  getSemverComments.returns([])
  const expected = 'new comment'
  writeComment.returns(expected)

  program.dryRun = false
  return expect(github.writeComments(authData, program, prs, comment))
    .to.be.fulfilled.then((commentList) => {
      commentList.forEach((comment) => {
        expect(comment).to.equal(expected)
      })
      prs.forEach((pr) => {
        expect(writeComment).to.have.been.calledWith(
          authData, program.owner, program.project, pr, comment)
      })
    })
})

test('github.writeComments: does not write comments if dryRun is set', (t) => {
  const { getSemverComments, github, listComments, program, writeComment } = t.context
  listComments.yields(null, ['some comment', 'another comment'])
  getSemverComments.returns([])

  program.dryRun = true
  return expect(github.writeComments(authData, program, prs, comment))
    .to.be.fulfilled.then((commentList) => {
      commentList.forEach((comment) => {
        expect(comment).to.be.null
      })
      expect(writeComment).to.not.have.been.called
    })
})

test('github.writeComments: does not write comments if semver comments are found', (t) => {
  const { getSemverComments, github, listComments, logger, program, writeComment } = t.context
  listComments.yields(null, ['some comment', 'another comment'])
  const semverComments = ['some semver comment']
  getSemverComments.returns(semverComments)

  program.dryRun = false
  return expect(github.writeComments(authData, program, prs, comment))
    .to.be.fulfilled.then((commentList) => {
      commentList.forEach((comment) => {
        expect(comment).to.be.null
      })
      prs.forEach((pr) => {
        expect(logger.warn).to.have.been.calledWith(
          'Semver comments found in PR#%d: %s',
          pr, JSON.stringify(semverComments))
      })
      expect(writeComment).to.not.have.been.called
    })
})
