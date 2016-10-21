"""Initial tables (tmp)

Revision ID: ad0920b379
Revises: 
Create Date: 2016-10-07 15:56:09.582700

"""

# revision identifiers, used by Alembic.
revision = 'ad0920b379'
down_revision = None
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
from lingvodoc.models import SLBigInteger

def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('basegroup',
    sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
    sa.Column('id',SLBigInteger(), nullable=False),
    sa.Column('name', sa.UnicodeText(), nullable=False),
    sa.Column('subject', sa.UnicodeText(), nullable=False),
    sa.Column('action', sa.UnicodeText(), nullable=False),
    sa.Column('dictionary_default', sa.Boolean(), nullable=False),
    sa.Column('perspective_default', sa.Boolean(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('organization',
    sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
    sa.Column('id',SLBigInteger(), nullable=False),
    sa.Column('name', sa.UnicodeText(), nullable=True),
    sa.Column('about', sa.UnicodeText(), nullable=True),
    sa.Column('marked_for_deletion', sa.Boolean(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('translationgist',
    sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
    sa.Column('object_id',SLBigInteger(), nullable=False),
    sa.Column('client_id',SLBigInteger(), nullable=False),
    sa.Column('type', sa.UnicodeText(), nullable=True),
    sa.Column('marked_for_deletion', sa.Boolean(), nullable=False),
    sa.PrimaryKeyConstraint('object_id', 'client_id')
    )
    op.create_table('field',
    sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
    sa.Column('object_id',SLBigInteger(), nullable=False),
    sa.Column('client_id',SLBigInteger(), nullable=False),
    sa.Column('translation_gist_client_id',SLBigInteger(), nullable=False),
    sa.Column('translation_gist_object_id',SLBigInteger(), nullable=False),
    sa.Column('data_type_translation_gist_client_id',SLBigInteger(), nullable=False),
    sa.Column('data_type_translation_gist_object_id',SLBigInteger(), nullable=False),
    sa.Column('marked_for_deletion', sa.Boolean(), nullable=False),
    sa.Column('is_translatable', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['data_type_translation_gist_client_id', 'data_type_translation_gist_object_id'], ['translationgist.client_id', 'translationgist.object_id'], ),
    sa.ForeignKeyConstraint(['translation_gist_object_id', 'translation_gist_client_id'], ['translationgist.object_id', 'translationgist.client_id'], ),
    sa.PrimaryKeyConstraint('object_id', 'client_id')
    )
    op.create_table('group',
    sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
    sa.Column('id',SLBigInteger(), nullable=False),
    sa.Column('base_group_id',SLBigInteger(), nullable=False),
    sa.Column('subject_client_id',SLBigInteger(), nullable=True),
    sa.Column('subject_object_id',SLBigInteger(), nullable=True),
    sa.Column('subject_override', sa.Boolean(), nullable=True),
    sa.ForeignKeyConstraint(['base_group_id'], ['basegroup.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('language',
    sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
    sa.Column('object_id',SLBigInteger(), nullable=False),
    sa.Column('client_id',SLBigInteger(), nullable=False),
    sa.Column('parent_object_id',SLBigInteger(), nullable=True),
    sa.Column('parent_client_id',SLBigInteger(), nullable=True),
    sa.Column('translation_gist_client_id',SLBigInteger(), nullable=False),
    sa.Column('translation_gist_object_id',SLBigInteger(), nullable=False),
    sa.Column('marked_for_deletion', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['parent_object_id', 'parent_client_id'], ['language.object_id', 'language.client_id'], ),
    sa.ForeignKeyConstraint(['translation_gist_object_id', 'translation_gist_client_id'], ['translationgist.object_id', 'translationgist.client_id'], ),
    sa.PrimaryKeyConstraint('object_id', 'client_id')
    )
    op.create_table('translationatom',
    sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
    sa.Column('object_id',SLBigInteger(), nullable=False),
    sa.Column('client_id',SLBigInteger(), nullable=False),
    sa.Column('parent_object_id',SLBigInteger(), nullable=True),
    sa.Column('parent_client_id',SLBigInteger(), nullable=True),
    sa.Column('content', sa.UnicodeText(), nullable=False),
    sa.Column('locale_id',SLBigInteger(), nullable=False),
    sa.Column('marked_for_deletion', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['parent_object_id', 'parent_client_id'], ['translationgist.object_id', 'translationgist.client_id'], ),
    sa.PrimaryKeyConstraint('object_id', 'client_id')
    )
    op.create_table('dictionary',
    sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
    sa.Column('object_id',SLBigInteger(), nullable=False),
    sa.Column('client_id',SLBigInteger(), nullable=False),
    sa.Column('parent_object_id',SLBigInteger(), nullable=True),
    sa.Column('parent_client_id',SLBigInteger(), nullable=True),
    sa.Column('translation_gist_client_id',SLBigInteger(), nullable=False),
    sa.Column('translation_gist_object_id',SLBigInteger(), nullable=False),
    sa.Column('state_translation_gist_client_id',SLBigInteger(), nullable=False),
    sa.Column('state_translation_gist_object_id',SLBigInteger(), nullable=False),
    sa.Column('marked_for_deletion', sa.Boolean(), nullable=False),
    sa.Column('additional_metadata', sa.UnicodeText(), nullable=True),
    sa.Column('category', SLBigInteger(), nullable=False),
    sa.Column('domain', SLBigInteger(), nullable=False),
    sa.ForeignKeyConstraint(['parent_object_id', 'parent_client_id'], ['language.object_id', 'language.client_id'], ),
    sa.ForeignKeyConstraint(['state_translation_gist_client_id', 'state_translation_gist_object_id'], ['translationgist.client_id', 'translationgist.object_id'], ),
    sa.ForeignKeyConstraint(['translation_gist_object_id', 'translation_gist_client_id'], ['translationgist.object_id', 'translationgist.client_id'], ),
    sa.PrimaryKeyConstraint('object_id', 'client_id')
    )
    op.create_table('locale',
    sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
    sa.Column('id',SLBigInteger(), nullable=False),
    sa.Column('parent_object_id',SLBigInteger(), nullable=True),
    sa.Column('parent_client_id',SLBigInteger(), nullable=True),
    sa.Column('shortcut', sa.UnicodeText(), nullable=False),
    sa.Column('intl_name', sa.UnicodeText(), nullable=False),
    sa.ForeignKeyConstraint(['parent_object_id', 'parent_client_id'], ['language.object_id', 'language.client_id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('organization_to_group_association',
    sa.Column('organization_id', sa.BigInteger(), nullable=True),
    sa.Column('group_id', sa.BigInteger(), nullable=True),
    sa.ForeignKeyConstraint(['group_id'], ['group.id'], ),
    sa.ForeignKeyConstraint(['organization_id'], ['organization.id'], )
    )
    op.create_table('dictionaryperspective',
    sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
    sa.Column('object_id',SLBigInteger(), nullable=False),
    sa.Column('client_id',SLBigInteger(), nullable=False),
    sa.Column('parent_object_id',SLBigInteger(), nullable=True),
    sa.Column('parent_client_id',SLBigInteger(), nullable=True),
    sa.Column('translation_gist_client_id',SLBigInteger(), nullable=False),
    sa.Column('translation_gist_object_id',SLBigInteger(), nullable=False),
    sa.Column('state_translation_gist_client_id',SLBigInteger(), nullable=False),
    sa.Column('state_translation_gist_object_id',SLBigInteger(), nullable=False),
    sa.Column('marked_for_deletion', sa.Boolean(), nullable=False),
    sa.Column('is_template', sa.Boolean(), nullable=False),
    sa.Column('import_source', sa.UnicodeText(), nullable=True),
    sa.Column('import_hash', sa.UnicodeText(), nullable=True),
    sa.Column('additional_metadata', sa.UnicodeText(), nullable=True),
    sa.ForeignKeyConstraint(['parent_object_id', 'parent_client_id'], ['dictionary.object_id', 'dictionary.client_id'], ),
    sa.ForeignKeyConstraint(['state_translation_gist_client_id', 'state_translation_gist_object_id'], ['translationgist.client_id', 'translationgist.object_id'], ),
    sa.ForeignKeyConstraint(['translation_gist_object_id', 'translation_gist_client_id'], ['translationgist.object_id', 'translationgist.client_id'], ),
    sa.PrimaryKeyConstraint('object_id', 'client_id')
    )
    op.create_table('user',
    sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
    sa.Column('id',SLBigInteger(), nullable=False),
    sa.Column('login', sa.UnicodeText(), nullable=False),
    sa.Column('name', sa.UnicodeText(), nullable=True),
    sa.Column('intl_name', sa.UnicodeText(), nullable=False),
    sa.Column('additional_metadata', sa.UnicodeText(), nullable=True),
    sa.Column('default_locale_id',SLBigInteger(), nullable=False),
    sa.Column('birthday', sa.Date(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['default_locale_id'], ['locale.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('login')
    )
    op.create_table('client',
    sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
    sa.Column('id',SLBigInteger(), nullable=False),
    sa.Column('user_id',SLBigInteger(), nullable=False),
    sa.Column('is_browser_client', sa.Boolean(), nullable=False),
    sa.Column('counter',SLBigInteger(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('dictionaryperspectivetofield',
    sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
    sa.Column('object_id',SLBigInteger(), nullable=False),
    sa.Column('client_id',SLBigInteger(), nullable=False),
    sa.Column('parent_object_id',SLBigInteger(), nullable=True),
    sa.Column('parent_client_id',SLBigInteger(), nullable=True),
    sa.Column('self_client_id',SLBigInteger(), nullable=True),
    sa.Column('self_object_id',SLBigInteger(), nullable=True),
    sa.Column('field_client_id',SLBigInteger(), nullable=False),
    sa.Column('field_object_id',SLBigInteger(), nullable=False),
    sa.Column('link_client_id',SLBigInteger(), nullable=True),
    sa.Column('link_object_id',SLBigInteger(), nullable=True),
    sa.Column('position', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['field_client_id', 'field_object_id'], ['field.client_id', 'field.object_id'], ),
    sa.ForeignKeyConstraint(['link_client_id', 'link_object_id'], ['dictionaryperspective.client_id', 'dictionaryperspective.object_id'], ),
    sa.ForeignKeyConstraint(['parent_object_id', 'parent_client_id'], ['dictionaryperspective.object_id', 'dictionaryperspective.client_id'], ),
    sa.ForeignKeyConstraint(['self_client_id', 'self_object_id'], ['dictionaryperspectivetofield.client_id', 'dictionaryperspectivetofield.object_id'], ),
    sa.PrimaryKeyConstraint('object_id', 'client_id')
    )
    op.create_table('email',
    sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
    sa.Column('id',SLBigInteger(), nullable=False),
    sa.Column('user_id',SLBigInteger(), nullable=False),
    sa.Column('email', sa.UnicodeText(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email')
    )
    op.create_table('lexicalentry',
    sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
    sa.Column('object_id',SLBigInteger(), nullable=False),
    sa.Column('client_id',SLBigInteger(), nullable=False),
    sa.Column('parent_object_id',SLBigInteger(), nullable=True),
    sa.Column('parent_client_id',SLBigInteger(), nullable=True),
    sa.Column('moved_to', sa.UnicodeText(), nullable=True),
    sa.Column('marked_for_deletion', sa.Boolean(), nullable=True),
    sa.Column('additional_metadata', sa.UnicodeText(), nullable=True),
    sa.ForeignKeyConstraint(['parent_object_id', 'parent_client_id'], ['dictionaryperspective.object_id', 'dictionaryperspective.client_id'], ),
    sa.PrimaryKeyConstraint('object_id', 'client_id')
    )
    op.create_table('passhash',
    sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
    sa.Column('id',SLBigInteger(), nullable=False),
    sa.Column('user_id',SLBigInteger(), nullable=False),
    sa.Column('hash', sa.UnicodeText(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('user_to_group_association',
    sa.Column('user_id', sa.BigInteger(), nullable=True),
    sa.Column('group_id', sa.BigInteger(), nullable=True),
    sa.ForeignKeyConstraint(['group_id'], ['group.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], )
    )
    op.create_table('user_to_organization_association',
    sa.Column('user_id', sa.BigInteger(), nullable=True),
    sa.Column('organization_id', sa.BigInteger(), nullable=True),
    sa.ForeignKeyConstraint(['organization_id'], ['organization.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], )
    )
    op.create_table('userblobs',
    sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
    sa.Column('object_id',SLBigInteger(), nullable=False),
    sa.Column('client_id',SLBigInteger(), nullable=False),
    sa.Column('name', sa.UnicodeText(), nullable=False),
    sa.Column('content', sa.UnicodeText(), nullable=False),
    sa.Column('real_storage_path', sa.UnicodeText(), nullable=False),
    sa.Column('data_type', sa.UnicodeText(), nullable=False),
    sa.Column('additional_metadata', sa.UnicodeText(), nullable=True),
    sa.Column('marked_for_deletion', sa.Boolean(), nullable=True),
    sa.Column('user_id',SLBigInteger(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('object_id', 'client_id')
    )
    op.create_table('entity',
    sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
    sa.Column('object_id',SLBigInteger(), nullable=False),
    sa.Column('client_id',SLBigInteger(), nullable=False),
    sa.Column('parent_object_id',SLBigInteger(), nullable=True),
    sa.Column('parent_client_id',SLBigInteger(), nullable=True),
    sa.Column('self_client_id',SLBigInteger(), nullable=True),
    sa.Column('self_object_id',SLBigInteger(), nullable=True),
    sa.Column('field_client_id',SLBigInteger(), nullable=False),
    sa.Column('field_object_id',SLBigInteger(), nullable=False),
    sa.Column('link_client_id',SLBigInteger(), nullable=True),
    sa.Column('link_object_id',SLBigInteger(), nullable=True),
    sa.Column('content', sa.UnicodeText(), nullable=True),
    sa.Column('additional_metadata', sa.UnicodeText(), nullable=True),
    sa.Column('locale_id',SLBigInteger(), nullable=True),
    sa.Column('marked_for_deletion', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['field_client_id', 'field_object_id'], ['field.client_id', 'field.object_id'], ),
    sa.ForeignKeyConstraint(['link_client_id', 'link_object_id'], ['lexicalentry.client_id', 'lexicalentry.object_id'], ),
    sa.ForeignKeyConstraint(['parent_object_id', 'parent_client_id'], ['lexicalentry.object_id', 'lexicalentry.client_id'], ),
    sa.ForeignKeyConstraint(['self_client_id', 'self_object_id'], ['entity.client_id', 'entity.object_id'], ),
    sa.PrimaryKeyConstraint('object_id', 'client_id')
    )
    op.create_table('publishingentity',
    sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
    sa.Column('object_id',SLBigInteger(), nullable=False),
    sa.Column('client_id',SLBigInteger(), nullable=False),
    sa.Column('published', sa.Boolean(), nullable=False),
    sa.Column('accepted', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['client_id', 'object_id'], ['entity.client_id', 'entity.object_id'], ),
    sa.PrimaryKeyConstraint('object_id', 'client_id')
    )
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('publishingentity')
    op.drop_table('entity')
    op.drop_table('userblobs')
    op.drop_table('user_to_organization_association')
    op.drop_table('user_to_group_association')
    op.drop_table('passhash')
    op.drop_table('lexicalentry')
    op.drop_table('email')
    op.drop_table('dictionaryperspectivetofield')
    op.drop_table('client')
    op.drop_table('user')
    op.drop_table('dictionaryperspective')
    op.drop_table('organization_to_group_association')
    op.drop_table('locale')
    op.drop_table('dictionary')
    op.drop_table('translationatom')
    op.drop_table('language')
    op.drop_table('group')
    op.drop_table('field')
    op.drop_table('translationgist')
    op.drop_table('organization')
    op.drop_table('basegroup')
    ### end Alembic commands ###
